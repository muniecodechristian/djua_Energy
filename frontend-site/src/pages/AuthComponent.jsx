import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "@/hooks/Zustand/useAuth";



// Définition des variantes d'animation pour un effet de transition haut de gamme
const viewVariants = {
  hidden: (direction) => ({
    opacity: 0,
    y: direction > 0 ? 15 : -15,
    filter: "blur(4px)"
  }),
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 30,
      mass: 0.8
    }
  },
  exit: (direction) => ({
    opacity: 0,
    y: direction > 0 ? -15 : 15,
    filter: "blur(4px)",
    transition: {
      duration: 0.15,
      ease: "easeInOut"
    }
  })
};

export default function AuthComponent() {
  const [view, setView] = useState('login'); // 'login' ou 'register'
  
  // Permet de déterminer le sens du balayage vertical de l'animation
  const direction = view === 'login' ? -1 : 1;





const navigate = useNavigate();

const { login, isLoading } = useAuthStore();

const [formData, setFormData] = useState({
  email: "",
  password: "",
});

const handleChange = (e) => {
  setFormData((prev) => ({
    ...prev,
    [e.target.name]: e.target.value,
  }));
};

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await login(formData);

    navigate("/dashboard");
  } catch (err) {
    console.error(err);
  }
};


  return (
    <div className="min-h-screen  flex items-center justify-center p-6">
      {/* motion.div layout adapte automatiquement la hauteur du cadre avec fluidité */}
      <motion.div 
        layout
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 32
        }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
      >
        
        {/* Header avec logo */}
        <div className="p-8 pb-4 text-center">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">E-schoolb</h1>
          <p className="text-slate-500 text-sm mt-1">Plateforme de gestion scolaire</p>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {view === 'login' ? (
            <motion.div
              key="login"
              custom={direction}
              variants={viewVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="p-8 pt-0 space-y-6"
            >
              <div className="space-y-4">
                <input type="email" placeholder="Email professionnel" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                <input type="password" placeholder="Mot de passe" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-200"
              >
                Connexion
              </motion.button>

              <p className="text-center text-sm text-slate-500">
                Pas de compte ?{' '}
                <button onClick={() => setView('register')} className="text-blue-600 font-bold hover:underline">
                  Demander un accès
                </button>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="register"
              custom={direction}
              variants={viewVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="p-8 pt-0 flex flex-col items-center text-center space-y-4"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                {/* Illustration minimaliste */}
                <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.192 9.192L5.636 5.636m3.536 3.536l-3.536 3.536M12 12v.01" />
                </svg>
              </div>
              
              <h2 className="text-xl font-bold text-slate-900">Ouvrir un compte</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pour garantir la sécurité de votre établissement, l'ouverture d'un compte sur <span className="font-bold text-blue-600">E-schoolb</span> se fait exclusivement via notre service commercial.
              </p>
              
              <motion.a 
                href="mailto:support@e-schoolb.com" 
                whileHover={{ scale: 1.015, backgroundColor: "rgba(239, 246, 255, 1)" }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="w-full mt-4 py-4 border-2 border-blue-600 text-blue-600 font-bold rounded-xl block text-center transition-colors"
              >
                Contacter le support
              </motion.a>
              
              <button onClick={() => setView('login')} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                Retour à la connexion
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}