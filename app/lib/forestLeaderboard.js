// Public, read-only Supabase RPCs. This publishable key cannot write player or score data.
const URL = 'https://ttwccxstxyzmgjxdmjee.supabase.co';
const KEY = 'sb_publishable_kpKvFO5vA_THEuOuyadBYg__ieImw-d';
async function rpc(name, body) {
 const response = await fetch(URL+'/rest/v1/rpc/'+name,{
  method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(body),
  cache:'no-store'
 });
 if (!response.ok) throw new Error('Supabase leaderboard read failed: '+response.status);
 return response.json();
}
export async function getForestLeaderboard(period='weekly') {
 const [rows,seasons] = await Promise.all([
   rpc('forest_public_leaderboard',{period}),
   period==='weekly'?rpc('forest_current_season',{}):Promise.resolve([])
 ]);
 return {status:seasons.length || period==='all'?'ok':'no-season',rows,season:seasons[0]||null};
}
