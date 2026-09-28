// Animated silhouettes retain clear collision silhouettes against detailed scenery.
export function drawWolf(c,e,t){
 c.save();c.translate(e.x+18,e.y+23);c.scale(e.vx<0?-1:1,1);
 const fur=c.createLinearGradient(0,-25,0,22);fur.addColorStop(0,'#728493');fur.addColorStop(1,'#273641');c.fillStyle=fur;
 c.beginPath();c.ellipse(-2,0,27,14,-.1,0,Math.PI*2);c.fill();
 c.beginPath();c.moveTo(-22,0);c.quadraticCurveTo(-48,-30,-42,-8);c.lineTo(-26,10);c.fill();
 for(let i=0;i<4;i++){const swing=Math.sin(t*11+i*Math.PI)*7;c.strokeStyle=i%2?'#526471':'#354653';c.lineWidth=6;c.beginPath();c.moveTo(i<2?-16:14,6);c.lineTo((i<2?-16:14)+swing,18);c.lineTo((i<2?-16:14)+swing+7,19);c.stroke();}
 c.fillStyle=fur;c.beginPath();c.moveTo(8,-3);c.lineTo(14,-25);c.lineTo(22,-34);c.lineTo(25,-22);c.lineTo(35,-12);c.lineTo(44,-7);c.lineTo(38,0);c.lineTo(19,6);c.closePath();c.fill();c.fillStyle='#f6d99c';c.beginPath();c.arc(28,-14,2.5,0,Math.PI*2);c.fill();c.fillStyle='#101923';c.fillRect(40,-9,5,4);c.restore();
}
export function drawDragon(c,b,t){
 c.save();c.translate(b.x+32,b.y+45);const flap=Math.sin(t*2)*8;
 for(const direction of [-1,1]){c.save();c.scale(direction,1);c.fillStyle='#203b3b';c.strokeStyle='#749886';c.lineWidth=2;c.beginPath();c.moveTo(4,-5);c.lineTo(43,-69+flap);c.lineTo(95,-87+flap);c.lineTo(77,-40);c.lineTo(57,-47);c.lineTo(42,-15);c.lineTo(25,-25);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(4,-5);c.lineTo(43,-69+flap);c.lineTo(57,-47);c.stroke();c.restore();}
 c.strokeStyle='#385951';c.lineWidth=13;c.beginPath();c.moveTo(0,20);c.bezierCurveTo(65,50,82,32,100,12+flap);c.stroke();
 const scales=c.createLinearGradient(-25,-30,30,40);scales.addColorStop(0,'#75917a');scales.addColorStop(1,'#263d37');c.fillStyle=scales;c.beginPath();c.ellipse(0,8,31,35,-.2,0,Math.PI*2);c.fill();
 c.strokeStyle='#a4aa75';c.lineWidth=3;for(let i=0;i<5;i++){c.beginPath();c.moveTo(-17,i*9-6);c.lineTo(15,i*9-3);c.stroke();}
 c.fillStyle='#80957a';c.beginPath();c.moveTo(8,-7);c.lineTo(8,-43);c.lineTo(-14,-54);c.lineTo(-28,-44);c.lineTo(-47,-36);c.lineTo(-43,-22);c.lineTo(-15,-20);c.lineTo(-17,4);c.fill();
 c.fillStyle='#c6c399';c.beginPath();c.moveTo(-10,-48);c.lineTo(4,-72);c.lineTo(4,-43);c.fill();c.beginPath();c.moveTo(-24,-46);c.lineTo(-25,-66);c.lineTo(-14,-49);c.fill();
 c.shadowColor=b.phase==='charging'?'#ff7449':'#b4edac';c.shadowBlur=15;c.fillStyle=c.shadowColor;c.beginPath();c.arc(-23,-38,4,0,Math.PI*2);c.fill();c.shadowBlur=0;
 if(b.phase==='charging'){c.fillStyle='#ffb759';c.beginPath();c.arc(-43,-26,5+Math.sin(t*25)*2,0,Math.PI*2);c.fill();}
 c.restore();
}
