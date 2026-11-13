process.env.JWT_SECRET='test-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz';
process.env.CORS_ORIGIN='http://localhost:5173';
const assert=require('node:assert/strict');
const db=require('../src/lib/db');
const bcrypt=require('bcrypt');
const users=[];
db.query=async(sql,p=[])=>{
 if(sql.includes('INSERT INTO users')){users.push({id:p[0],name:p[1],email:p[2],password_hash:p[3]});return [{}];}
 if(sql.includes('FROM users WHERE email'))return [users.filter(u=>u.email===p[0])];
 if(sql.includes('FROM users WHERE id'))return [users.filter(u=>u.id===p[0])];
 if(sql.includes('medical_records WHERE id = ? AND user_id'))return [[]];
 return [[]];
};
const app=require('../src/server');
const server=app.listen(0,'127.0.0.1',async()=>{
 const base=`http://127.0.0.1:${server.address().port}`;
 async function call(path,body,cookie,origin='http://localhost:5173') {return fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});}
 try {
 assert.equal((await call('/api/records')).status,401);
 assert.equal((await call('/api/auth/login',{},null,'https://evil.example')).status,403);
 assert.equal((await call('/api/auth/login',{email:[],password:{}})).status,400);
 const signup=await call('/api/auth/signup',{email:'test@example.com',name:'Test',password:'strong-test-password'});
 assert.equal(signup.status,201);const cookie=signup.headers.get('set-cookie');assert.match(cookie,/HttpOnly/i);assert.match(cookie,/SameSite=Strict/i);assert.equal((await signup.json()).token,undefined);
 assert.equal((await call('/api/auth/me',undefined,cookie)).status,200);
 assert.equal((await call('/api/records/not-owned',undefined,cookie)).status,404);
 assert.equal((await call('/api/reminders',{medicine_name:[]},cookie)).status,400);
 assert.equal((await call('/api/ai/translate',{texts:['hi']})).status,401);
 const status=await call('/api/status');assert.equal(status.headers.get('cache-control'),'no-store');assert.ok(status.headers.get('content-security-policy'));
 const logout=await call('/api/auth/logout',{},cookie);assert.match(logout.headers.get('set-cookie'),/Expires=Thu, 01 Jan 1970/);
 for(let i=0;i<16;i++)await call('/api/auth/login',{email:'x@example.com',password:'invalid-password'});
 assert.equal((await call('/api/auth/login',{email:'x@example.com',password:'invalid-password'})).status,429);
 console.log('PASS security integration: authentication, cookie flags, origin checks, validation, ownership, no-store, headers, logout, rate limiting');
 }catch(e){console.error(e);process.exitCode=1;}finally{server.close();await db.end();}
});
