import { Children, createElement, isValidElement } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { easeOut, revealItem } from '../lib/motion';

const tags = { div:motion.div, section:motion.section, header:motion.header, aside:motion.aside, form:motion.form };
const group = {
 hidden:{opacity:1},
 show:{opacity:1,transition:{when:'beforeChildren',delayChildren:0.04,staggerChildren:0.055}},
 exit:{opacity:0,transition:{when:'afterChildren',duration:0.08}},
};
const fade = {
 hidden:{opacity:0},
 show:{opacity:1,transition:{duration:0.28,ease:easeOut}},
 exit:{opacity:0,transition:{duration:0.08}},
};
// Preserve coordinate systems for sticky content, maps and fixed overlays.
function anchored(element) {
 if (!isValidElement(element)) return false;
 if (/(fixed|sticky|leaflet|map)/i.test(String(element.props.className || ''))) return true;
 return Children.toArray(element.props.children).some(anchored);
}
function sections(children, depth, reduced) {
 const items=Children.toArray(children);
 const count=Math.max(1,items.filter(isValidElement).length);
 const stagger=Math.min(0.055,0.22/count);
 return Children.map(children, (child,index) => {
  if (!isValidElement(child) || !tags[child.type] || depth > 1) return child;
  const { children:nested, ...props } = child.props;
  const card=/(card|panel|rounded.*border|border.*rounded)/.test(String(props.className || ''));
  const base=card && !reduced && !anchored(child) ? revealItem : fade;
  const variants={
   ...base,
   show:{...base.show,transition:{...base.show.transition,delayChildren:reduced?0:0.025,staggerChildren:reduced?0:stagger}},
   exit:fade.exit,
  };
  return createElement(tags[child.type], {...props,key:child.key ?? index,variants},
   sections(nested,depth+1,reduced));
 });
}
export default function PageEntrance({children,...props}) {
 const reduced=useReducedMotion();
 return <motion.div {...props} variants={group} initial={reduced ? false : 'hidden'} animate="show" exit="exit">
  {sections(children,0,reduced)}
 </motion.div>;
}
