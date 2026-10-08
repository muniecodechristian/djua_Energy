export const easeOut = [0.22, 1, 0.36, 1];
export const quickSpring = { type:'spring', stiffness:420, damping:34, mass:0.7 };
export const revealGroup = { hidden:{}, show:{transition:{delayChildren:0.04,staggerChildren:0.065}} };
export const revealItem = {hidden:{opacity:0,y:22,scale:0.97},show:{opacity:1,y:0,scale:1,transition:{type:'spring',stiffness:240,damping:25,mass:0.8,opacity:{duration:0.25}}}};
