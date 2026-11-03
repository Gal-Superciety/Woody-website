import test from 'node:test';
import assert from 'node:assert/strict';
import { UserSecretKey } from '@multiversx/sdk-core';
import { registerForestProfile } from '../app/lib/forestProfileService.mjs';
const wallet = UserSecretKey.generate().generatePublicKey().toAddress('erd').toBech32();
const anotherWallet = UserSecretKey.generate().generatePublicKey().toAddress('erd').toBech32();
const input = { wallet, username: 'Woody_Player' };
const unavailable = () => { throw new Error('database must not be called'); };
for (const [name, body] of [['missing payload',null],['invalid wallet',{...input,wallet:'fake'}],['short name',{...input,username:'ab'}],['long name',{...input,username:'x'.repeat(21)}],['invalid name characters',{...input,username:'<script>'}]]) {
  test(`profile rejects ${name} before authentication or database access`, async () => {
    const result = await registerForestProfile(body, 'proof', {verify:unavailable,pool:unavailable});
    assert.equal(result.status,400);
  });
}
test('profile cannot be created without a login proof',async()=>{
  assert.equal((await registerForestProfile(input,'',{verify:unavailable,pool:unavailable})).status,401);
});
for (const [name, result] of [['invalid proof',null],['proof belonging to another wallet',anotherWallet]]) {
  test(`profile rejects ${name} without a database write`, async()=>{
    assert.equal((await registerForestProfile(input,'proof',{verify:async()=>result,pool:unavailable})).status,401);
  });
}
test('authentication outage returns a retryable service error',async()=>{
  const result=await registerForestProfile(input,'proof',{verify:async()=>{throw new Error('network');},pool:unavailable});
  assert.equal(result.status,503);
});
test('verified login saves trimmed name with parameterized SQL and returns saved profile',async()=>{
  let writes=0;
  const result=await registerForestProfile({...input,username:' Woody_Player '},'proof',{
    verify:async()=>wallet,
    pool:()=>({query:async(sql,params)=>{writes++;assert.match(sql,/VALUES \(\$1, \$2\)/);assert.deepEqual(params,[wallet,'Woody_Player']);return {rows:[input]};}}),
  });
  assert.equal(writes,1);assert.equal(result.status,201);assert.deepEqual(result.body.profile,input);
});
for (const [constraint, expected] of [['forest_players_username_ci','username_taken'],['forest_players_username_key','username_taken'],['forest_players_pkey','profile_already_exists']]) {
  test(`duplicate ${constraint} produces a recoverable conflict`, async()=>{
    const result=await registerForestProfile(input,'proof',{verify:async()=>wallet,pool:()=>({query:async()=>{throw {code:'23505',constraint};}})});
    assert.equal(result.status,409);assert.equal(result.body.error,expected);
  });
}
test('database failure never reports a saved profile or leaks database details',async()=>{
  const result=await registerForestProfile(input,'proof',{verify:async()=>wallet,pool:()=>{throw new Error('postgres://private');}});
  assert.deepEqual(result,{status:503,body:{error:'profile_service_unavailable'}});
});
