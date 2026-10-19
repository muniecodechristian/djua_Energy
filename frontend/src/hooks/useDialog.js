import { useEffect, useRef } from 'react';
const stack=[];
let originalOverflow='';
export default function useDialog(open,onClose) {
 const ref=useRef(null),close=useRef(onClose);
 useEffect(()=>{close.current=onClose;},[onClose]);
 useEffect(()=>{
   if(!open)return;const id=Symbol('dialog'),previous=document.activeElement;
   if(!stack.length){originalOverflow=document.body.style.overflow;document.body.style.overflow='hidden';}stack.push(id);
   const nodes=()=>[...(ref.current?.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')||[])].filter(el=>el.getClientRects().length);
   const frame=requestAnimationFrame(()=>nodes()[0]?.focus());
   const key=event=>{if(stack.at(-1)!==id)return;if(event.key==='Escape'){event.preventDefault();close.current?.();}if(event.key==='Tab'){const list=nodes(),first=list[0],last=list.at(-1);if(!list.length){event.preventDefault();return;}if(event.shiftKey&&(document.activeElement===first||!ref.current?.contains(document.activeElement))){event.preventDefault();last.focus();}else if(!event.shiftKey&&(document.activeElement===last||!ref.current?.contains(document.activeElement))){event.preventDefault();first.focus();}}};
   document.addEventListener('keydown',key);
   return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',key);const index=stack.indexOf(id);if(index>=0)stack.splice(index,1);if(!stack.length)document.body.style.overflow=originalOverflow;if(previous?.isConnected)previous.focus();};
 },[open]);return ref;
}
