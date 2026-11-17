/* qr.js – QR Code generator written from scratch (ISO 18004: byte mode, error-correction level M, versions 1-5).
   Fits up to ~80 characters, plenty for "HP:HP-0234-8891". Usage: qrSVG('HP:HP-0234-8891') -> SVG string.
   The staff scanner reads it with the browser's BarcodeDetector (or the ID can be typed). */
   function qrMatrix(text){
    const data=[...new TextEncoder().encode(text)];
    const T=[0,[16,10,1],[28,16,1],[44,26,1],[64,18,2],[86,24,2]];          // [data codewords, EC per block, blocks]
    let v=1; while(v<=5 && data.length+3>T[v][0]) v++;
    if(v>5) throw new Error('QR text too long');
    const [dc,ec,nb]=T[v], size=17+4*v, bits=[], put=(x,n)=>{for(let i=n-1;i>=0;i--)bits.push((x>>i)&1)};
    put(4,4); put(data.length,8); data.forEach(b=>put(b,8)); put(0,Math.min(4,dc*8-bits.length)); while(bits.length%8)bits.push(0);
    for(let p=0xEC;bits.length<dc*8;p^=0xFD) put(p,8);                       // pad bytes EC / 11
    const cw=[]; for(let i=0;i<bits.length;i+=8) cw.push(parseInt(bits.slice(i,i+8).join(''),2));
    // Reed-Solomon over GF(256)
    const exp=[],log=[]; let x=1; for(let i=0;i<255;i++){exp[i]=x;log[x]=i;x<<=1;if(x&256)x^=0x11D}
    const mul=(a,b)=>a&&b?exp[(log[a]+log[b])%255]:0; let g=[1];
    for(let i=0;i<ec;i++){const n=Array(g.length+1).fill(0);g.forEach((c,j)=>{n[j]^=c;n[j+1]^=mul(c,exp[i])});g=n}
    const rs=d=>{const r=Array(ec).fill(0);for(const b of d){const f=b^r.shift();r.push(0);if(f)g.slice(1).forEach((c,i)=>r[i]^=mul(c,f))}return r};
    const per=dc/nb, bl=[]; for(let i=0;i<nb;i++) bl.push(cw.slice(i*per,(i+1)*per)); const ecs=bl.map(rs), fin=[];
    for(let i=0;i<per;i++) bl.forEach(b=>fin.push(b[i])); for(let i=0;i<ec;i++) ecs.forEach(b=>fin.push(b[i]));
    const fb=[]; fin.forEach(b=>{for(let i=7;i>=0;i--)fb.push((b>>i)&1)}); if(v>1) for(let i=0;i<7;i++) fb.push(0);
    // Function patterns
    const m=Array.from({length:size},()=>Array(size).fill(0)), f=Array.from({length:size},()=>Array(size).fill(false));
    const set=(r,c,val,M=m)=>{if(r>=0&&c>=0&&r<size&&c<size){M[r][c]=val?1:0;f[r][c]=true}};
    const finder=(r,c)=>{for(let i=-1;i<=7;i++)for(let j=-1;j<=7;j++){const d=Math.max(Math.abs(i-3),Math.abs(j-3));set(r+i,c+j,d!==2&&d!==4)}};
    finder(0,0);finder(0,size-7);finder(size-7,0);
    for(let i=8;i<size-8;i++){set(6,i,i%2===0);set(i,6,i%2===0)}
    if(v>1){const c=size-7;for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)set(c+i,c+j,Math.max(Math.abs(i),Math.abs(j))!==1)}
    const fmt=(M,mask)=>{let r=mask;for(let i=0;i<10;i++)r=(r<<1)^((r>>9)*0x537);const b=((mask<<10)|r)^0x5412,B=i=>(b>>i)&1;
      for(let i=0;i<=5;i++)set(i,8,B(i),M); set(7,8,B(6),M); set(8,8,B(7),M); set(8,7,B(8),M);
      for(let i=9;i<15;i++)set(8,14-i,B(i),M); for(let i=0;i<8;i++)set(8,size-1-i,B(i),M);
      for(let i=8;i<15;i++)set(size-15+i,8,B(i),M); set(size-8,8,1,M)};
    fmt(m,0);
    // Place data bits in the zig-zag pattern
    let k=0; for(let right=size-1;right>=1;right-=2){ if(right===6)right=5;
      for(let vert=0;vert<size;vert++)for(let j=0;j<2;j++){const c=right-j,up=((right+1)&2)===0,r=up?size-1-vert:vert;
        if(!f[r][c]&&k<fb.length)m[r][c]=fb[k++]}}
    // Try all 8 masks, keep the one with the fewest long runs
    const mf=[(r,c)=>(r+c)%2===0,(r,c)=>r%2===0,(r,c)=>c%3===0,(r,c)=>(r+c)%3===0,(r,c)=>(Math.floor(r/2)+Math.floor(c/3))%2===0,
      (r,c)=>r*c%2+r*c%3===0,(r,c)=>(r*c%2+r*c%3)%2===0,(r,c)=>((r+c)%2+r*c%3)%2===0];
    let best,bp=1e9; for(let mk=0;mk<8;mk++){
      const M=m.map(r=>r.slice()); for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(!f[r][c]&&mf[mk](r,c))M[r][c]^=1; fmt(M,mk);
      let p=0; for(const line of [...M,...M[0].map((_,c)=>M.map(r=>r[c]))]){let run=1;for(let i=1;i<size;i++){if(line[i]===line[i-1])run++;else{if(run>=5)p+=run-2;run=1}}if(run>=5)p+=run-2}
      if(p<bp){bp=p;best=M}}
    return best;
  }
  function qrSVG(text, dark='#172F35'){
    const M=qrMatrix(text), n=M.length, q=4; let d='';
    M.forEach((row,r)=>row.forEach((x,c)=>{if(x)d+=`M${c+q} ${r+q}h1v1h-1z`}));
    return `<svg viewBox="0 0 ${n+2*q} ${n+2*q}" shape-rendering="crispEdges" role="img" aria-label="HealthPass QR code"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="${dark}"/></svg>`;
  }  