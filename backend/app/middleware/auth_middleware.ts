import type { HttpContext } from '@adonisjs/core/http';
 import jwt from 'jsonwebtoken';
  import { User } from '../models/index.js';
export async function protect({request,response}:HttpContext){
    try{const token=request.cookie('token');
         if(!token)return response.unauthorized({success:false,message:'Not authorized'});
         const p:any=jwt.verify(token,process.env.JWT_SECRET||'super_secret_fallback_djua_energy_2026_key');
          const u=await User.findById(p.id).lean(); if(!u)return response.unauthorized({success:false,message:'Not authorized'});
           return response.ok({success:true,data:u})}catch{return response.unauthorized({success:false,message:'Not authorized'})}
}
