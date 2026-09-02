import mongoose from 'mongoose'
const loose = { type: mongoose.Schema.Types.Mixed }
const schema = (definition:any, collection?:string) => mongoose.models[collection || 'x'] || mongoose.model(collection || 'x', new mongoose.Schema(definition,{timestamps:true,strict:false}))
export const User = schema({nom:String,prenom:String,postNom:String,identifier:{type:String,unique:true,lowercase:true},password:{type:String,select:false},role:{type:String,default:'kitireceveur'}},'User')
export const Kit = schema({kitId:{type:String,index:true},clientPhone:String,status:String,gpsCoordinates:loose},'Kit')
export const Telemetry = schema({kitId:{type:String,index:true},deviceId:String,gpsCoordinates:loose,battery:loose,solar:loose,dc_load:loose,ac_load:loose,environment:loose,meta:loose,extraData:loose},'Telemetry')
export const Alert = schema({kitId:{type:String,index:true},source:String,type:String,severity:String,label:String,description:String,metadata:loose,status:{type:String,default:'active'}},'Alert')
export const EnrichedTelemetry = schema({identity:loose,records:loose,kitId:String,kit_id:String},'EnrichedTelemetry')
export const Client = schema({kitId:String,clientPhone:String},'Client')
export const Payment = schema({paymentId:{type:String,index:true},clientPhone:String,date:Date},'Payment')
export const ScoringData = schema({clientPhone:{type:String,index:true}},'ScoringData')
