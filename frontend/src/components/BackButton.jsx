import { ArrowLeft } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { quickSpring } from '../lib/motion';

export default function BackButton({ fallback = '/dashboard' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = useReducedMotion();
  const goBack = () => {
    // Only go back when React Router recorded an entry in this app.
    const index = window.history.state?.idx;
    if (location.key !== 'default' && Number.isInteger(index) && index > 0) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };
  return (
    <motion.button type="button" className="ops-back-button" onClick={goBack}
      aria-label="Retour à la page précédente"
      title="Retour à la page précédente"
      whileHover={reduced ? undefined : { x: -2 }}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      transition={quickSpring}>
      <ArrowLeft size={17} aria-hidden="true"/>
      <span>Retour</span>
    </motion.button>
  );
}
