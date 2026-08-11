<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-school B</title>
    <meta name="description" content="E-school B - Application complète de gestion scolaire pour les établissements éducatifs en Afrique. Simplifiez l'administration, améliorez la communication et optimisez les performances académiques.">
    <meta name="keywords" content="E-school B, Gestion scolaire, école en RDC, application éducation République Démocrtatique du Congo, Afrique, administration scolaire, gestion des écoles et Universités, parents et élèves, écoles et parents, enseignants">
    <meta name="author" content="E-school B">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://eschoolb.africa/">
    <meta property="og:title" content="E-school B | Application de Gestion des Écoles">
    <meta property="og:description" content="Application complète de gestion scolaire pour les établissements éducatifs en Afrique. Simplifiez l'administration, améliorez la communication.">
    <meta property="og:image" content="https://eschoolb.africa/images/logoeschoolb.png">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" sizes="32x32" href="images/faviconesb-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="images/faviconesb-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="manifest" href="/site.webmanifest">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #030624;
            --secondary-color: #d4a225;
            --white: #ffffff;
            --light-bg: #f8f9fa;
            --dark-text: #333333;
            --transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            --gradient: linear-gradient(135deg, var(--primary-color), #1a1f3d);
            --gradient-secondary: linear-gradient(135deg, var(--secondary-color), #e6b845);
            --shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            --shadow-hover: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Poppins', sans-serif;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            background-color: var(--white);
            color: var(--dark-text);
            overflow-x: hidden;
        }

        /* Loading Animation */
        .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--gradient);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            transition: opacity 0.5s ease, visibility 0.5s ease;
        }

        .loading-screen.fade-out {
            opacity: 0;
            visibility: hidden;
        }

        .logo-animation {
            text-align: center;
            color: var(--white);
        }

        .logo-animation h1 {
            font-size: 4rem;
            font-weight: 700;
            margin-bottom: 20px;
            position: relative;
            display: inline-block;
        }

        .logo-animation h1 span {
            color: var(--secondary-color);
        }

        .logo-animation .subtitle {
            font-size: 1.4rem;
            opacity: 0.9;
            animation: fadeIn 3s ease 0s both;
        }

        .loading-progress {
            width: 200px;
            height: 4px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
            margin: 20px auto 0;
            overflow: hidden;
        }

        .loading-progress-bar {
            height: 100%;
            background: var(--secondary-color);
            width: 0%;
            animation: loading 3s ease-in-out forwards;
        }

        /* Particles Background */
        #particles-js {
            position: fixed;
            width: 100%;
            height: 100%;
            z-index: -1;
        }

        /* Header & Navigation */
        header {
            background-color: rgba(255, 255, 255, 0.95);
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px 0;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .logo-icon {
            width: 40px;
            height: 40px;
            background: var(--gradient);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--white);
            font-size: 20px;
        }

        .logo h1 {
            font-size: 26px;
            font-weight: 700;
            color: var(--primary-color);
        }

        .logo span {
            color: var(--secondary-color);
        }

        .nav-links {
            display: flex;
            list-style: none;
        }

        .nav-links li {
            margin-left: 30px;
        }

        .nav-links a {
            text-decoration: none;
            color: var(--primary-color);
            font-weight: 500;
            transition: var(--transition);
            position: relative;
            padding: 5px 0;
        }

        .nav-links a:hover {
            color: var(--secondary-color);
        }

        .nav-links a::after {
            content: '';
            position: absolute;
            width: 0;
            height: 3px;
            bottom: 0;
            left: 0;
            background: var(--gradient-secondary);
            border-radius: 3px;
            transition: var(--transition);
        }

        .nav-links a:hover::after {
            width: 100%;
        }

        .btn {
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
            border: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .btn-primary {
            background: var(--gradient);
            color: var(--white);
            box-shadow: 0 5px 15px rgba(3, 6, 36, 0.2);
        }

        .btn-primary:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(3, 6, 36, 0.3);
        }

        .btn-secondary {
            background: var(--gradient-secondary);
            color: var(--white);
            box-shadow: 0 5px 15px rgba(212, 162, 37, 0.2);
        }

        .btn-secondary:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(212, 162, 37, 0.3);
        }

        .mobile-menu {
            display: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--primary-color);
        }

        /* CORRECTION : Menu mobile caché par défaut */
        .mobile-nav {
            display: none;
            position: fixed;
            top: 80px;
            left: 0;
            width: 100%;
            background-color: var(--white);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            padding: 20px;
            z-index: 1000;
        }

        .mobile-nav.active {
            display: block;
        }

        .mobile-nav ul {
            list-style: none;
        }

        .mobile-nav li {
            margin-bottom: 15px;
        }

        .mobile-nav a {
            text-decoration: none;
            color: var(--primary-color);
            font-weight: 500;
            display: block;
            padding: 12px 0;
            border-bottom: 1px solid #f0f0f0;
        }

        .mobile-nav a:last-child {
            border-bottom: none;
        }

        /* Hero Section */
        .hero {
            background: linear-gradient(rgba(3, 6, 36, 0.85), rgba(3, 6, 36, 0.9)), url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80') no-repeat center center/cover;
            color: var(--white);
            padding: 200px 0 120px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .hero-content {
            max-width: 800px;
            margin: 0 auto;
            position: relative;
            z-index: 1;
        }

        .hero h2 {
            font-size: 52px;
            margin-bottom: 20px;
            animation: fadeInUp 1s ease;
            line-height: 1.2;
        }

        .hero p {
            font-size: 20px;
            margin: 0 auto 40px;
            animation: fadeInUp 1.5s ease;
            line-height: 1.6;
            opacity: 0.9;
        }

        .hero-btns {
            display: flex;
            justify-content: center;
            gap: 20px;
            animation: fadeInUp 2s ease;
        }

        .hero-illustration {
            max-width: 600px;
            margin: 40px auto 0;
           padding-top: 40px;
        }

        .floating-elements {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            overflow: hidden;
        }

        .floating-element {
            position: absolute;
            background: rgba(212, 162, 37, 0.1);
            border-radius: 50%;
            animation: float 15s infinite linear;
        }

        .floating-element:nth-child(1) {
            width: 80px;
            height: 80px;
            top: 10%;
            left: 10%;
            animation-delay: 0s;
        }

        .floating-element:nth-child(2) {
            width: 120px;
            height: 120px;
            top: 20%;
            right: 10%;
            animation-delay: 2s;
        }

        .floating-element:nth-child(3) {
            width: 60px;
            height: 60px;
            bottom: 20%;
            left: 15%;
            animation-delay: 4s;
        }

        .floating-element:nth-child(4) {
            width: 100px;
            height: 100px;
            bottom: 10%;
            right: 15%;
            animation-delay: 6s;
        }

        /* Statistics Section */
        .stats {
            padding: 100px 0;
            background-color: var(--light-bg);
            position: relative;
        }

        .stats-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
        }

        .stat-card {
            background-color: var(--white);
            border-radius: 15px;
            padding: 40px 30px;
            text-align: center;
            box-shadow: var(--shadow);
            transition: var(--transition);
            position: relative;
            overflow: hidden;
            z-index: 1;
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 5px;
            background: var(--gradient-secondary);
            z-index: 2;
        }

        .stat-card:hover {
            transform: translateY(-15px);
            box-shadow: var(--shadow-hover);
        }

        .stat-icon {
            font-size: 50px;
            margin-bottom: 20px;
            background: var(--gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
        }

        .stat-number {
            font-size: 42px;
            font-weight: 700;
            color: var(--primary-color);
            margin-bottom: 10px;
        }

        .stat-text {
            color: var(--dark-text);
            font-size: 18px;
            font-weight: 500;
        }

        /* Features Section */
        .features {
            padding: 100px 0;
        }

        .section-title {
            text-align: center;
            margin-bottom: 60px;
        }

        .section-title h2 {
            font-size: 40px;
            color: var(--primary-color);
            margin-bottom: 15px;
            position: relative;
            display: inline-block;
        }

        .section-title h2::after {
            content: '';
            position: absolute;
            width: 80px;
            height: 4px;
            background: var(--gradient-secondary);
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 2px;
        }

        .section-title p {
            color: var(--dark-text);
            max-width: 600px;
            margin: 0 auto;
            font-size: 18px;
        }

        .features-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 30px;
        }

        .feature-card {
            background-color: var(--white);
            border-radius: 15px;
            padding: 40px 30px;
            text-align: center;
            box-shadow: var(--shadow);
            transition: var(--transition);
            position: relative;
            overflow: hidden;
        }

        .feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--gradient);
            opacity: 0;
            transition: var(--transition);
            z-index: 0;
        }

        .feature-card:hover::before {
            opacity: 0.05;
        }

        .feature-card:hover {
            transform: translateY(-15px);
            box-shadow: var(--shadow-hover);
        }

        .feature-icon {
            width: 90px;
            height: 90px;
            margin: 0 auto 25px;
            background: var(--gradient);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--white);
            font-size: 36px;
            position: relative;
            z-index: 1;
            transition: var(--transition);
        }

        .feature-card:hover .feature-icon {
            transform: scale(1.1) rotate(10deg);
            background: var(--gradient-secondary);
        }

        .feature-card h3 {
            font-size: 24px;
            margin-bottom: 15px;
            color: var(--primary-color);
            position: relative;
            z-index: 1;
        }

        .feature-card p {
            color: var(--dark-text);
            position: relative;
            z-index: 1;
            line-height: 1.6;
        }

        /* Illustration Section */
        .illustration-section {
            padding: 100px 0;
            background: linear-gradient(to bottom, var(--light-bg), var(--white));
        }

        .illustration-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 50px;
        }

        .illustration-content {
            flex: 1;
        }

        .illustration-content h2 {
            font-size: 36px;
            color: var(--primary-color);
            margin-bottom: 20px;
        }

        .illustration-content p {
            font-size: 18px;
            line-height: 1.6;
            margin-bottom: 30px;
            color: var(--dark-text);
        }

        .illustration-image {
            flex: 1;
            text-align: center;
        }

        .illustration-image svg {
            max-width: 100%;
            height: auto;
        }

        /* Download Section */
        .download {
            padding: 100px 0;
            background: linear-gradient(rgba(3, 6, 36, 0.9), rgba(3, 6, 36, 0.95)), url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80') no-repeat center center/cover;
            color: var(--white);
            text-align: center;
            position: relative;
        }

        .download h2 {
            font-size: 40px;
            margin-bottom: 20px;
        }

        .download p {
            font-size: 18px;
            max-width: 700px;
            margin: 0 auto 50px;
            opacity: 0.9;
        }

        .download-btns {
            display: flex;
            justify-content: center;
            gap: 25px;
            flex-wrap: wrap;
        }

        .download-btn {
            display: flex;
            align-items: center;
            gap: 15px;
            background-color: var(--white);
            color: var(--primary-color);
            padding: 20px 30px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            transition: var(--transition);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .download-btn:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
        }

        .download-btn i {
            font-size: 36px;
        }

        .download-btn div {
            text-align: left;
        }

        .download-btn div :first-child {
            font-size: 14px;
            font-weight: 500;
        }

        .download-btn div :last-child {
            font-size: 18px;
            font-weight: 700;
        }

        /* Partners Section */
        .partners {
            padding: 80px 0;
            background-color: var(--light-bg);
            overflow: hidden;
        }

        .partners-container {
            display: flex;
            animation: scroll 25s linear infinite;
        }

        .partner-logo {
            flex-shrink: 0;
            width: 180px;
            height: 100px;
            margin: 0 40px;
            background-color: var(--white);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: var(--shadow);
            transition: var(--transition);
        }

        .partner-logo:hover {
            transform: translateY(-5px);
        }

        .partner-logo i {
            font-size: 48px;
            color: var(--primary-color);
        }

        /* Testimonials Section */
        .testimonials {
            padding: 100px 0;
        }

        .testimonials-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }

        .testimonial-card {
            background-color: var(--white);
            border-radius: 15px;
            padding: 30px;
            box-shadow: var(--shadow);
            transition: var(--transition);
            position: relative;
        }

        .testimonial-card:hover {
            transform: translateY(-10px);
            box-shadow: var(--shadow-hover);
        }

        .testimonial-content {
            margin-bottom: 20px;
            position: relative;
        }

        .testimonial-content p {
            font-style: italic;
            line-height: 1.6;
            position: relative;
            z-index: 1;
        }

        .testimonial-content::before {
            content: "";
            font-size: 80px;
            color: rgba(212, 162, 37, 0.1);
            position: absolute;
            top: -30px;
            left: -10px;
            z-index: 0;
        }

        .testimonial-author {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .author-avatar {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: var(--gradient);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--white);
            font-size: 24px;
            font-weight: 600;
        }

        .author-info h4 {
            color: var(--primary-color);
            margin-bottom: 5px;
        }

        .author-info p {
            color: var(--secondary-color);
            font-size: 14px;
        }

        /* Footer */
        footer {
            background-color: var(--primary-color);
            color: var(--white);
            padding: 80px 0 30px;
            position: relative;
        }

        .footer-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 40px;
            margin-bottom: 50px;
        }

        .footer-col h3 {
            font-size: 22px;
            margin-bottom: 25px;
            position: relative;
            padding-bottom: 10px;
        }

        .footer-col h3::after {
            content: '';
            position: absolute;
            left: 0;
            bottom: 0;
            width: 50px;
            height: 3px;
            background-color: var(--secondary-color);
            border-radius: 2px;
        }

        .footer-col p {
            margin-bottom: 15px;
            line-height: 1.6;
            opacity: 0.8;
        }

        .footer-col a {
            color: var(--white);
            text-decoration: none;
            opacity: 0.8;
            transition: var(--transition);
            display: block;
            margin-bottom: 10px;
        }

        .footer-col a:hover {
            opacity: 1;
            color: var(--secondary-color);
            transform: translateX(5px);
        }

        .social-links {
            display: flex;
            gap: 15px;
        }

        .social-links a {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 45px;
            height: 45px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            color: var(--white);
            transition: var(--transition);
            font-size: 18px;
        }

        .social-links a:hover {
            background-color: var(--secondary-color);
            transform: translateY(-5px);
        }

        .footer-bottom {
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Back to Top Button */
        .back-to-top {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            background: var(--gradient);
            color: var(--white);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            cursor: pointer;
            transition: var(--transition);
            opacity: 0;
            visibility: hidden;
            z-index: 999;
            box-shadow: 0 5px 15px rgba(3, 6, 36, 0.3);
        }

        .back-to-top.active {
            opacity: 1;
            visibility: visible;
        }

        .back-to-top:hover {
            transform: translateY(-5px);
            background: var(--gradient-secondary);
        }

        /* Popup */
        .popup {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 2000;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
        }

        .popup-content {
            background-color: var(--white);
            padding: 50px 40px;
            border-radius: 20px;
            width: 90%;
            max-width: 500px;
            text-align: center;
            position: relative;
            animation: popupFade 0.5s ease;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }

        .close-popup {
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 24px;
            cursor: pointer;
            color: var(--dark-text);
            transition: var(--transition);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .close-popup:hover {
            background-color: rgba(0, 0, 0, 0.05);
            color: var(--secondary-color);
        }

        .popup h2 {
            color: var(--primary-color);
            margin-bottom: 15px;
            font-size: 28px;
        }

        .popup p {
            margin-bottom: 30px;
            color: var(--dark-text);
        }

        .popup-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .popup-form input {
            padding: 18px 20px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 16px;
            transition: var(--transition);
        }

        .popup-form input:focus {
            border-color: var(--secondary-color);
            outline: none;
            box-shadow: 0 0 0 3px rgba(212, 162, 37, 0.2);
        }

        /* Animations */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes float {
            0% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
            100% { transform: translateY(0) rotate(360deg); }
        }

        @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }

        @keyframes popupFade {
            from { opacity: 0; transform: scale(0.8) translateY(-20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes loading {
            0% { width: 0%; }
            100% { width: 100%; }
        }

        /* Responsive Design */
        @media (max-width: 992px) {
            .hero h2 {
                font-size: 42px;
            }
            
            .hero p {
                font-size: 18px;
            }
            
            .nav-links {
                display: none;
            }
            
            .mobile-menu {
                display: block;
            }
            
            .logo-animation h1 {
                font-size: 3rem;
            }
        }

        @media (max-width: 768px) {
            .hero {
                padding: 160px 0 80px;
            }
            
            .hero h2 {
                font-size: 36px;
            }
            
            .hero-btns {
                flex-direction: column;
                align-items: center;
            }
            
            .download-btns {
                flex-direction: column;
                align-items: center;
            }
            
            .stat-number {
                font-size: 36px;
            }
            
            .section-title h2 {
                font-size: 32px;
            }
            
            .feature-card, .stat-card {
                padding: 30px 20px;
            }
            
            .logo-animation h1 {
                font-size: 2.5rem;
            }
        }

        @media (max-width: 576px) {
            .hero h2 {
                font-size: 32px;
            }
            
            .hero p {
                font-size: 16px;
            }
            
            .btn {
                padding: 10px 20px;
            }
            
            .download-btn {
                padding: 15px 20px;
            }
            
            .download-btn i {
                font-size: 28px;
            }
            
            .logo-animation h1 {
                font-size: 2rem;
            }
            
            .logo-animation .subtitle {
                font-size: 1rem;
            }
        }
    </style>
</head>
<body>
    <!-- Loading Animation -->
    <div class="loading-screen" id="loadingScreen">
    <div class="logo-animation">
        <img src="images/logo-eschoolbchargement.png" alt="E-school B" class="loading-logo">
        <div class="subtitle">Révolution de la Gestion Scolaire en Afrique</div>
        <div class="loading-progress">
            <div class="loading-progress-bar"></div>
        </div>
    </div>
    </div>

    <!-- Particles Background -->
    <div id="particles-js"></div>

    <!-- Header & Navigation -->
    <header>
        <div class="container">
            <nav class="navbar">
                <div class="logo">
                    <img src="images/logo-eschoolb.png" alt="E-school B Logo">
                </div>
                <ul class="nav-links">
                    <li><a href="#accueil">Accueil</a></li>
                    <li><a href="#statistiques">Statistiques</a></li>
                    <li><a href="#fonctionnalites">Fonctionnalités</a></li>
                    <li><a href="#temoignages">Témoignages</a></li>
                    <li><a href="#telecharger">Télécharger</a></li>
                    <li><a href="#contact">Contact</a></li>
                    <li><button class="btn btn-primary" id="monEspaceBtn"><i class="fas fa-user-circle"></i> Mon Ecole</button></li>
                </ul>
                <div class="mobile-menu">
                    <i class="fas fa-bars"></i>
                </div>
            </nav>
            <!-- CORRECTION : Menu mobile caché par défaut -->
            <div class="mobile-nav">
                <ul>
                    <li><a href="#accueil">Accueil</a></li>
                    <li><a href="#statistiques">Statistiques</a></li>
                    <li><a href="#fonctionnalites">Fonctionnalités</a></li>
                    <li><a href="#temoignages">Témoignages</a></li>
                    <li><a href="#telecharger">Télécharger</a></li>
                    <li><a href="#contact">Contact</a></li>
                    <li><a href="#" id="mobileEspaceBtn">Mon Espace</a></li>
                </ul>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="hero" id="accueil">
        <div class="floating-elements">
            <div class="floating-element"></div>
            <div class="floating-element"></div>
            <div class="floating-element"></div>
            <div class="floating-element"></div>
        </div>
        <div class="container">
            <div class="hero-content">
                <h2>Révolutionnez la Gestion de Votre École</h2>
                <p>E-school B est une application complète de gestion scolaire qui simplifie l'administration, améliore la communication et optimise les performances académiques pour les établissements éducatifs modernes.</p>
                <div class="hero-btns">
                    <button class="btn btn-primary"><i class="fas fa-rocket"></i> Démarrer Maintenant</button>
                    <button class="btn btn-secondary"><i class="fas fa-play-circle"></i> Voir la Démo</button>
                </div>
            </div>
            <div class="hero-illustration">
    <video autoplay muted loop playsinline class="hero-media-video">
        <source src="images/bg-hero.mp4" type="video/mp4">
        Votre navigateur ne prend pas en charge la lecture de vidéo.
    </video>
</div>
        </div>
    </section>

    <!-- Statistics Section -->
    <section class="stats" id="statistiques">
        <div class="container">
            <div class="stats-container">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                    <div class="stat-number" data-target="58000">0</div>
                    <div class="stat-text">Élèves Enregistrés</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-school"></i>
                    </div>
                    <div class="stat-number" data-target="12">0</div>
                    <div class="stat-text">Écoles Enregistrées</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-number" data-target="31000">0</div>
                    <div class="stat-text">Parents Connectés</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-handshake"></i>
                    </div>
                    <div class="stat-number" data-target="5">0</div>
                    <div class="stat-text">Partenariats</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features" id="fonctionnalites">
        <div class="container">
            <div class="section-title">
                <h2>Fonctionnalités Avancées</h2>
                <p>Découvrez comment E-school B transforme la gestion scolaire avec des outils innovants et intuitifs.</p>
            </div>
            <div class="features-container">
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <h3>Analytique des Performances</h3>
                    <p>Analysez les résultats académiques et identifiez les domaines d'amélioration avec des rapports détaillés et des tableaux de bord interactifs.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-comments"></i>
                    </div>
                    <h3>Communication Intégrée</h3>
                    <p>Facilitez la communication entre enseignants, parents et administration avec des notifications en temps réel et un système de messagerie intégré.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <h3>Gestion des Emplois du Temps</h3>
                    <p>Créez et gérez facilement les emplois du temps avec un système intelligent qui évite les conflits et optimise l'utilisation des ressources.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-file-invoice-dollar"></i>
                    </div>
                    <h3>Gestion Financière</h3>
                    <p>Automatisez la gestion des frais scolaires, des paiements et générez des reçus automatiquement avec un suivi en temps réel.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-user-check"></i>
                    </div>
                    <h3>Portail Parent</h3>
                    <p>Offrez aux parents un accès direct aux informations académiques et comportementales de leurs enfants avec des alertes personnalisées.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <h3>Application Mobile</h3>
                    <p>Accédez à toutes les fonctionnalités depuis votre smartphone avec notre application dédiée disponible sur iOS et Android.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Illustration Section -->
    <section class="illustration-section" id="illustrations">
        <div class="container">
            <div class="illustration-container">
                <div class="illustration-content">
                    <h2>Une Expérience Éducative Moderne</h2>
                    <p>Notre plateforme intègre les dernières technologies pour offrir une expérience éducative complète et moderne. Avec E-school B, gérez efficacement tous les aspects de votre établissement scolaire.</p>
                    <p>Des outils intuitifs conçus spécifiquement pour le contexte éducatif africain, avec une interface adaptée aux besoins locaux.</p>
                    <button class="btn btn-primary">En savoir plus</button>
                </div>
                <div class="illustration-image">
                    <!-- Illustration vectorielle d'interface moderne -->
                    <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#030624;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#1a1f3d;stop-opacity:1" />
                            </linearGradient>
                            <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#d4a225;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#e6b845;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        
                        <!-- Appareils -->
                        <rect x="100" y="50" width="120" height="200" rx="10" fill="url(#grad3)" />
                        <rect x="240" y="80" width="160" height="240" rx="15" fill="url(#grad3)" />
                        
                        <!-- Écrans -->
                        <rect x="110" y="60" width="100" height="180" rx="5" fill="#f8f9fa" />
                        <rect x="250" y="90" width="140" height="220" rx="8" fill="#f8f9fa" />
                        
                        <!-- Contenu tablette -->
                        <circle cx="160" cy="100" r="8" fill="url(#grad4)" />
                        <rect x="120" y="120" width="80" height="5" fill="#030624" rx="2" />
                        <rect x="120" y="135" width="60" height="5" fill="#d4a225" rx="2" />
                        <rect x="120" y="150" width="70" height="5" fill="#030624" rx="2" />
                        <rect x="120" y="165" width="50" height="5" fill="#d4a225" rx="2" />
                        <rect x="120" y="200" width="80" height="25" fill="url(#grad4)" rx="5" />
                        <text x="160" y="215" text-anchor="middle" fill="white" font-family="Arial" font-size="10">Voir plus</text>
                        
                        <!-- Contenu téléphone -->
                        <circle cx="320" cy="120" r="15" fill="url(#grad4)" />
                        <text x="320" y="125" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">E</text>
                        <rect x="270" y="150" width="100" height="8" fill="#030624" rx="4" />
                        <rect x="270" y="170" width="80" height="8" fill="#d4a225" rx="4" />
                        <rect x="270" y="190" width="90" height="8" fill="#030624" rx="4" />
                        <rect x="270" y="210" width="70" height="8" fill="#d4a225" rx="4" />
                        
                        <!-- Graphique -->
                        <polyline points="280,250 300,230 320,260 340,240 360,270" fill="none" stroke="url(#grad4)" stroke-width="3" />
                        
                        <!-- Éléments décoratifs -->
                        <circle cx="400" cy="150" r="8" fill="url(#grad4)" opacity="0.7" />
                        <circle cx="380" cy="280" r="6" fill="url(#grad4)" opacity="0.5" />
                        <circle cx="110" cy="280" r="10" fill="url(#grad4)" opacity="0.3" />
                    </svg>
                </div>
            </div>
        </div>
    </section>

    <!-- Testimonials Section -->
    <section class="testimonials" id="temoignages">
        <div class="container">
            <div class="section-title">
                <h2>Témoignages</h2>
                <p>Découvrez ce que nos clients disent de notre application.</p>
            </div>
            <div class="testimonials-container">
                <div class="testimonial-card">
                    <div class="testimonial-content">
                        <p>E-school B a révolutionné la gestion de notre école. L'interface est intuitive et le support client est exceptionnel.</p>
                    </div>
                    <div class="testimonial-author">
                        <div class="author-avatar">PK</div>
                        <div class="author-info">
                            <h4>Patrick Kashange</h4>
                            <p>CEO, Azerty Corporation</p>
                        </div>
                    </div>
                </div>
                <div class="testimonial-card">
                    <div class="testimonial-content">
                        <p>La communication avec les parents s'est considérablement améliorée depuis que nous utilisons E-school B. Je le recommande vivement!</p>
                    </div>
                    <div class="testimonial-author">
                        <div class="author-avatar">LD</div>
                        <div class="author-info">
                            <h4>Loic Diama</h4>
                            <p>CEO, Diashi Academy</p>
                        </div>
                    </div>
                </div>
                <div class="testimonial-card">
                    <div class="testimonial-content">
                        <p>En tant que parent, pouvoir suivre les progrès de mon enfant en temps réel est inestimable. Merci E-school B!</p>
                    </div>
                    <div class="testimonial-author">
                        <div class="author-avatar">SK</div>
                        <div class="author-info">
                            <h4>Safi KAZADI</h4>
                            <p>Parent d'élève</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Download Section -->
    <section class="download" id="telecharger">
        <div class="container">
            <h2>Téléchargez la Version Mobile</h2>
            <p>Accédez à toutes les fonctionnalités d'E-school B depuis votre smartphone. Disponible sur iOS et Android.</p>
            <div class="download-btns">
                <a href="#" class="download-btn">
                    <i class="fab fa-apple"></i>
                    <div>
                        <div>Télécharger sur</div>
                        <div>App Store</div>
                    </div>
                </a>
                <a href="#" class="download-btn">
                    <i class="fab fa-google-play"></i>
                    <div>
                        <div>Disponible sur</div>
                        <div>Google Play</div>
                    </div>
                </a>
            </div>
        </div>
    </section>

    <!-- Partners Section -->
<section class="partners">
    <div class="partners-container">
        <a href="#" target="_blank" rel="noopener noreferrer" class="partner-logo">
            <img src="images/connect.jpg" alt="connect" height="100px" height="180px">
        </a>
        <a href="https://ingeniouscity.com" target="_blank" rel="noopener noreferrer" class="partner-logo">
            <img src="images/ingeniousCity.png" alt="Ingenious City">
        </a>
        <a href="https://orangecorners.com" target="_blank" rel="noopener noreferrer" class="partner-logo">
            <img src="images/orangecorners.png" alt="Orange Corners RDC">
        </a>
       
        <a href="https://www.diashiacademy.com" target="_blank" rel="noopener noreferrer" class="partner-logo">
            <img src="images/diashi.jpeg" alt="diashi"   height="100px" height="180px">
        </a>
        <a href="https://equitygroupholdings.com/cd" target="_blank" rel="noopener noreferrer" class="partner-logo">
            <img src="images/equity-bank.png" alt="EquityBCDC">
        </a>
        <!-- Duplicate for seamless scroll -->
       <a href="" target="_blank" rel="noopener noreferrer" class="partner-logo">
            <img src="images/connect.jpg" alt="Azerty Corporation"  height="100px" height="180px">
        </a>
        <a href="https://ingeniouscity.com" target="_blank" rel="noopener noreferrer" class="partner-logo">
            <img src="images/ingeniousCity.png" alt="Ingenious City">
        </a>
        <a href="https://orangecorners.com" target="_blank" rel="noopener noreferrer" class="partner-logo">
            <img src="images/orangecorners.png" alt="Orange Corners RDC">
        </a>
     
        <a href="https://www.diashiacademy.com" target="_blank" rel="noopener noreferrer" class="partner-logo">
            <img src="images/diashi.jpeg" alt="diashi"   height="100px" height="180px">
        </a>
        <a href="https://equitygroupholdings.com/cd" target="_blank" rel="noopener noreferrer" class="partner-logo">
            <img src="images/equity-bank.png" alt="EquityBCDC">
        </a>
    </div>
</section>

    <!-- Footer -->
    <footer id="contact">
        <div class="container">
            <div class="footer-container">
                <div class="footer-col">
                    <h3>E-school B</h3>
                    <p>Une solution complète de gestion scolaire conçue pour répondre aux besoins des établissements éducatifs modernes en Afrique et au-delà.</p>
                    <div class="social-links">
                        <a href="#"><i class="fab fa-facebook-f"></i></a>
                        <a href="#"><i class="fab fa-twitter"></i></a>
                        <a href="#"><i class="fab fa-instagram"></i></a>
                        <a href="#"><i class="fab fa-linkedin-in"></i></a>
                        <a href="#"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>
                <div class="footer-col">
                    <h3>Contact</h3>
                    <p><i class="fas fa-map-marker-alt"></i> 01, Avenue de l'OUA, Q/ Basoko, C/ Ngaliema, KINSHASA, RDC</p>
                    <p><i class="fas fa-phone"></i> +243 821 662 445</p>
                    <p><i class="fas fa-envelope"></i> contact@eschoolb.africa</p>
                    <p><i class="fas fa-clock"></i> Lun - Sam: 8h00 - 16h30</p>
                </div>
                <div class="footer-col">
                    <h3>Liens Rapides</h3>
                    <a href="#accueil">Accueil</a>
                    <a href="#statistiques">Statistiques</a>
                    <a href="#fonctionnalites">Fonctionnalités</a>
<!--                     <a href="#illustrations">Illustrations</a> -->
                    <a href="#temoignages">Témoignages</a>
                    <a href="#telecharger">Télécharger</a>
                    <a href="#contact">Contact</a>
                </div>
                <div class="footer-col">
                    <h3>Newsletter</h3>
                    <p>Abonnez-vous à notre newsletter pour recevoir les dernières actualités et mises à jour.</p>
                    <form class="popup-form">
                        <input type="email" placeholder="Votre adresse email" required>
                        <button type="submit" class="btn btn-primary">S'abonner</button>
                    </form>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 E-school B. Tous droits réservés. | Conçu avec <i class="fas fa-heart" style="color: #ee1010;"></i> pour l'éducation en Afrique</p>
            </div>
        </div>
    </footer>

    <!-- Back to Top Button -->
    <div class="back-to-top" id="backToTop">
        <i class="fas fa-chevron-up"></i>
    </div>

    <!-- Popup -->
    <div class="popup" id="popup">
        <div class="popup-content">
            <span class="close-popup">&times;</span>
            <h2>Connexion Ecole</h2>
            <p>Bienvenu dans votre Espace</p>
            <form class="popup-form">
                <input type="text" placeholder="Tapez Votre licence Ici" required>
                <button type="submit" class="btn btn-primary">Valider</button>
            </form>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"></script>
    <script>
        // Loading Animation
        window.addEventListener('load', function() {
            setTimeout(function() {
                document.getElementById('loadingScreen').classList.add('fade-out');
                setTimeout(function() {
                    document.getElementById('loadingScreen').style.display = 'none';
                }, 500);
            }, 2000); // 2 secondes d'animation
        });

        // Particles.js Configuration
        particlesJS("particles-js", {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: "#d4a225" },
                shape: { type: "circle" },
                opacity: { value: 0.5, random: true },
                size: { value: 3, random: true },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: "#030624",
                    opacity: 0.2,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: "none",
                    random: true,
                    straight: false,
                    out_mode: "out",
                    bounce: false
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: { enable: true, mode: "repulse" },
                    onclick: { enable: true, mode: "push" },
                    resize: true
                }
            }
        });

        // Mobile Menu Toggle
        document.querySelector('.mobile-menu').addEventListener('click', function() {
            document.querySelector('.mobile-nav').classList.toggle('active');
        });

        // Popup Functionality
        const monEspaceBtn = document.getElementById('monEspaceBtn');
        const mobileEspaceBtn = document.getElementById('mobileEspaceBtn');
        const popup = document.getElementById('popup');
        const closePopup = document.querySelector('.close-popup');

        monEspaceBtn.addEventListener('click', function() {
            popup.style.display = 'flex';
        });

        mobileEspaceBtn.addEventListener('click', function(e) {
            e.preventDefault();
            popup.style.display = 'flex';
            document.querySelector('.mobile-nav').classList.remove('active');
        });

        closePopup.addEventListener('click', function() {
            popup.style.display = 'none';
        });

        window.addEventListener('click', function(e) {
            if (e.target === popup) {
                popup.style.display = 'none';
            }
        });

        // Animated Statistics
        const statNumbers = document.querySelectorAll('.stat-number');
        
        function animateStats() {
            statNumbers.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-target'));
                const suffix = stat.textContent.includes('Mille') ? ' Mille' : '';
                let count = 0;
                const increment = target / 50;
                
                const updateCount = () => {
                    if (count < target) {
                        count += increment;
                        stat.textContent = Math.ceil(count) + suffix;
                        setTimeout(updateCount, 30);
                    } else {
                        stat.textContent = target + suffix;
                    }
                };
                
                updateCount();
            });
        }

        // Intersection Observer for stats animation
        const statsSection = document.querySelector('.stats');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateStats();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        observer.observe(statsSection);

        // Back to Top Button
        const backToTopBtn = document.getElementById('backToTop');
        
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('active');
            } else {
                backToTopBtn.classList.remove('active');
            }
        });

        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    document.querySelector('.mobile-nav').classList.remove('active');
                }
            });
        });

        // Add animation to feature cards on scroll
        const featureCards = document.querySelectorAll('.feature-card');
        const featureObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = `fadeInUp 0.8s ease forwards`;
                    entry.target.style.opacity = '0';
                    entry.target.style.transform = 'translateY(30px)';
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, 200);
                }
            });
        }, { threshold: 0.1 });

        featureCards.forEach(card => {
            featureObserver.observe(card);
        });
    </script>
</body>
</html>