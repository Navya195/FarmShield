"""
FarmShield Voice Diagnosis Engine
Complete NLP and Disease Prediction System
"""

import re
import json
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

class VoiceDiagnosisEngine:
    """Complete voice-based crop disease diagnosis system"""
    
    def __init__(self):
        self.diseases_db = self._load_diseases_database()
        self.symptoms_keywords = self._load_symptoms_keywords()
        self.crop_keywords = self._load_crop_keywords()
        self.severity_keywords = self._load_severity_keywords()
        logger.info("✅ Voice Diagnosis Engine initialized")
    
    def _load_diseases_database(self) -> Dict:
        """Load comprehensive disease database"""
        return {
            "tomato_early_blight": {
                "name": "Early Blight",
                "crop": "Tomato",
                "symptoms": ["dark spots", "yellow halo", "concentric rings", "leaf yellowing", "brown lesions"],
                "causes": "Alternaria solani fungus, high humidity, poor air circulation",
                "treatment": {
                    "immediate": "Remove infected leaves immediately and destroy them",
                    "organic": ["Neem oil spray (5ml per liter)", "Baking soda solution", "Copper fungicide"],
                    "chemical": ["Mancozeb 75% WP @ 2.5g/L", "Azoxystrobin 23% SC @ 1ml/L"],
                    "prevention": ["Rotate crops", "Maintain plant spacing", "Avoid overhead watering", "Mulch around plants"]
                },
                "severity_indicators": {
                    "mild": "Few spots on lower leaves only",
                    "moderate": "Multiple spots on several leaves",
                    "severe": "Extensive leaf damage, fruit infection"
                }
            },
            "tomato_late_blight": {
                "name": "Late Blight",
                "crop": "Tomato",
                "symptoms": ["water soaked spots", "white mold", "rapid wilting", "dark brown lesions", "fruit rot"],
                "causes": "Phytophthora infestans, cool wet weather, high humidity",
                "treatment": {
                    "immediate": "Remove all infected plants and burn them immediately",
                    "organic": ["Copper oxychloride spray", "Bordeaux mixture"],
                    "chemical": ["Metalaxyl + Mancozeb @ 2.5g/L", "Cymoxanil + Mancozeb"],
                    "prevention": ["Plant resistant varieties", "Improve drainage", "Apply preventive fungicide"]
                },
                "severity_indicators": {
                    "mild": "Small water-soaked spots",
                    "moderate": "Multiple lesions with mold",
                    "severe": "Complete plant collapse"
                }
            },
            "tomato_leaf_curl": {
                "name": "Tomato Leaf Curl Virus",
                "crop": "Tomato",
                "symptoms": ["leaf curling", "upward curling", "yellowing", "stunted growth", "reduced fruit"],
                "causes": "Whitefly transmission, viral infection",
                "treatment": {
                    "immediate": "Remove infected plants to prevent spread",
                    "organic": ["Yellow sticky traps for whiteflies", "Neem oil spray", "Garlic spray"],
                    "chemical": ["Imidacloprid @ 0.3ml/L for whiteflies", "Thiamethoxam"],
                    "prevention": ["Use virus-free seedlings", "Control whitefly population", "Plant marigold borders"]
                },
                "severity_indicators": {
                    "mild": "Slight curling on few leaves",
                    "moderate": "Curling on most leaves, some yellowing",
                    "severe": "Severe curling, plant stunting, no flowering"
                }
            },
            "potato_late_blight": {
                "name": "Potato Late Blight",
                "crop": "Potato",
                "symptoms": ["dark spots", "water soaked", "white fungus", "tuber rot", "brown flesh"],
                "causes": "Phytophthora infestans",
                "treatment": {
                    "immediate": "Remove infected plants and haulms",
                    "organic": ["Copper fungicide", "Bordeaux mixture"],
                    "chemical": ["Chlorothalonil @ 2g/L", "Metalaxyl"],
                    "prevention": ["Use certified seed", "Hill properly", "Harvest in dry weather"]
                },
                "severity_indicators": {
                    "mild": "Few leaf spots",
                    "moderate": "Multiple lesions, some tuber infection",
                    "severe": "Plant death, extensive tuber rot"
                }
            },
            "rice_blast": {
                "name": "Rice Blast Disease",
                "crop": "Rice",
                "symptoms": ["diamond shaped spots", "brown lesions", "white center", "leaf blight"],
                "causes": "Pyricularia oryzae fungus",
                "treatment": {
                    "immediate": "Apply fungicide at first sign",
                    "organic": ["Pseudomonas fluorescens", "Trichoderma"],
                    "chemical": ["Tricyclazole @ 0.6g/L", "Isoprothiolane"],
                    "prevention": ["Balanced fertilization", "Proper water management", "Resistant varieties"]
                },
                "severity_indicators": {
                    "mild": "Few diamond spots",
                    "moderate": "Multiple lesions, some panicle infection",
                    "severe": "Extensive damage, panicle blast"
                }
            },
            "wheat_rust": {
                "name": "Wheat Rust",
                "crop": "Wheat",
                "symptoms": ["orange pustules", "yellow rust", "brown rust", "powdery spots"],
                "causes": "Puccinia species fungus",
                "treatment": {
                    "immediate": "Apply fungicide immediately",
                    "organic": ["Sulfur dust", "Neem cake application"],
                    "chemical": ["Propiconazole @ 1ml/L", "Tebuconazole"],
                    "prevention": ["Resistant varieties", "Early sowing", "Balanced fertilization"]
                },
                "severity_indicators": {
                    "mild": "Few pustules on lower leaves",
                    "moderate": "Pustules on multiple leaves",
                    "severe": "Extensive pustules, yield loss"
                }
            },
            "bacterial_spot": {
                "name": "Bacterial Spot",
                "crop": "Multiple crops",
                "symptoms": ["small dark spots", "water soaked", "yellow halo", "leaf drop"],
                "causes": "Xanthomonas bacteria",
                "treatment": {
                    "immediate": "Remove infected parts",
                    "organic": ["Copper spray", "Hydrogen peroxide solution"],
                    "chemical": ["Streptomycin sulfate", "Copper hydroxide"],
                    "prevention": ["Use disease-free seeds", "Avoid overhead irrigation", "Crop rotation"]
                },
                "severity_indicators": {
                    "mild": "Few spots on leaves",
                    "moderate": "Multiple spots, some defoliation",
                    "severe": "Extensive defoliation, fruit infection"
                }
            },
            "powdery_mildew": {
                "name": "Powdery Mildew",
                "crop": "Multiple crops",
                "symptoms": ["white powder", "powdery coating", "leaf curling", "distorted growth"],
                "causes": "Various fungal species, dry conditions",
                "treatment": {
                    "immediate": "Apply fungicide or organic spray",
                    "organic": ["Baking soda spray", "Milk solution (1:10)", "Neem oil"],
                    "chemical": ["Sulfur dust", "Myclobutanil @ 1g/L"],
                    "prevention": ["Proper spacing", "Avoid excessive nitrogen", "Resistant varieties"]
                },
                "severity_indicators": {
                    "mild": "Light dusting on few leaves",
                    "moderate": "Powdery coating on many leaves",
                    "severe": "Extensive coating, leaf distortion"
                }
            },
            "banana_panama_wilt": {
                "name": "Panama Wilt (Fusarium Wilt)",
                "crop": "Banana",
                "symptoms": ["yellowing leaves", "wilting", "brown spots", "leaf rot", "spoiling", "stem rot"],
                "causes": "Fusarium oxysporum fungus, soil contamination",
                "treatment": {
                    "immediate": "Remove and destroy infected plants immediately to prevent spread",
                    "organic": ["Trichoderma viride soil application", "Pseudomonas fluorescens spray", "Neem cake in soil"],
                    "chemical": ["Carbendazim 1g/L soil drench", "Propiconazole 1ml/L spray"],
                    "prevention": ["Use disease-free suckers", "Avoid waterlogging", "Crop rotation", "Soil solarization"]
                },
                "severity_indicators": {
                    "mild": "Yellowing on lower leaves only",
                    "moderate": "Multiple leaves yellowing, some wilting",
                    "severe": "Plant collapse, stem rot visible"
                }
            },
            "banana_sigatoka": {
                "name": "Black Sigatoka Leaf Spot",
                "crop": "Banana",
                "symptoms": ["dark spots", "brown spots", "leaf spots", "black lesions", "yellowing", "spoiling"],
                "causes": "Mycosphaerella fijiensis fungus, high humidity",
                "treatment": {
                    "immediate": "Remove badly infected leaves and destroy them",
                    "organic": ["Bordeaux mixture spray", "Copper fungicide", "Neem oil spray"],
                    "chemical": ["Mancozeb 2.5g/L", "Propiconazole 1ml/L"],
                    "prevention": ["Proper plant spacing", "Remove dead leaves", "Avoid overhead irrigation"]
                },
                "severity_indicators": {
                    "mild": "Few small spots on older leaves",
                    "moderate": "Many spots, leaves yellowing",
                    "severe": "Extensive leaf death, fruit quality affected"
                }
            },
            "general_leaf_disease": {
                "name": "General Leaf Disease",
                "crop": "Multiple crops",
                "symptoms": ["spots", "yellowing", "wilting", "rot", "damage", "spoiling", "dying"],
                "causes": "Fungal, bacterial, or viral infection; environmental stress",
                "treatment": {
                    "immediate": "Inspect plant carefully; remove visibly infected parts",
                    "organic": ["Neem oil spray 5ml/L", "Copper oxychloride", "Trichoderma application"],
                    "chemical": ["Mancozeb 2.5g/L", "Carbendazim 1g/L"],
                    "prevention": ["Proper spacing", "Avoid overwatering", "Use disease-free seeds", "Regular monitoring"]
                },
                "severity_indicators": {
                    "mild": "Few leaves affected, early stage",
                    "moderate": "Several leaves affected, spreading",
                    "severe": "Majority of plant affected, urgent action needed"
                }
            }
        }
    
    def _load_symptoms_keywords(self) -> Dict:
        """Load symptom keywords for NLP extraction with Telugu support"""
        return {
            "spots": ["spot", "spots", "dotted", "marks", "patches", "lesion", "lesions", "మచ్చలు", "మచ్చ", "pulli"],
            "yellowing": ["yellow", "yellowing", "pale", "chlorosis", "పసుపు", "మంజు", "manjal"],
            "wilting": ["wilt", "wilting", "drooping", "sagging", "weak", "limp", "వాడిపోవడం", "vadi", "vadal"],
            "curling": ["curl", "curling", "twisted", "rolled", "bending", "వంకర"],
            "brown": ["brown", "browning", "dark", "blacken", "darkening", "గోధుమ రంగు"],
            "white": ["white", "whitish", "powdery", "powder", "తెలుపు", "vellai"],
            "fungus": ["mold", "mildew", "fungus", "fungi", "powder", "फफूंद", "పుప్పొడి"],
            "rot": ["rot", "rotting", "decay", "rotten", "spoil", "spoiling", "spoiled", "decompose", "కుళ్ళు"],
            "drying": ["dry", "drying", "dried", "crispy", "wither", "withering", "dead", "dying", "ఎండిపోవడం"],
            "holes": ["hole", "holes", "eaten", "chewed", "bitten", "రంధ్రాలు"],
            "black": ["black", "blackish", "dark spots", "నలుపు", "karuppu"],
            "insects": ["insect", "insects", "bug", "bugs", "pest", "pests", "worm", "worms", "aphid", "పురుగులు", "పురుగు"],
            "damage": ["damage", "damaged", "destroy", "destroying", "problem", "issue", "disease", "sick", "affected", "నష్టం", "సమస్య"],
            "falling": ["fall", "falling", "drop", "dropping", "shed", "shedding", "రాలిపోవడం"],
            "stunted": ["stunt", "stunted", "small", "not growing", "slow growth", "పెరగడం లేదు"]
        }
    
    def _load_crop_keywords(self) -> Dict:
        """Load crop identification keywords with Telugu support"""
        return {
            "tomato": ["tomato", "tomatoes", "tamatar", "tamato", "టమాటా", "టమోటా", "thakkali"],
            "potato": ["potato", "potatoes", "aloo", "batata", "బంగాళాదుంప", "ఆలూ", "urulaikizhangu"],
            "rice": ["rice", "paddy", "dhan", "chawal", "వరి", "బియ్యం", "arisi", "nellu"],
            "wheat": ["wheat", "gehun", "gehu", "గోధుమ", "godhumai"],
            "corn": ["corn", "maize", "makka", "bhutta", "మొక్కజొన్న", "cholam"],
            "chili": ["chili", "chilli", "pepper", "mirchi", "మిరపకాయ", "మిరియం", "milagai"],
            "brinjal": ["brinjal", "eggplant", "baingan", "వంకాయ", "kathiri"],
            "okra": ["okra", "bhindi", "ladyfinger", "బెండకాయ", "vendakkai"],
            "onion": ["onion", "pyaaz", "ఉల్లిపాయ", "vengayam"],
            "cotton": ["cotton", "kapas", "పత్తి", "paruthi"],
            "groundnut": ["groundnut", "peanut", "moongphali", "వేరుశెనగ", "nilakadalai"],
            "sugarcane": ["sugarcane", "ganna", "చెరకు", "karumbu"],
            "banana": ["banana", "bananas", "plantain", "అరటి", "అరటిపండు", "vazhai", "kela"],
            "mango": ["mango", "mangoes", "aam", "మామిడి", "manga"],
            "grape": ["grape", "grapes", "angur", "ద్రాక్ష", "thirakshi"],
            "apple": ["apple", "apples", "seb", "ఆపిల్"],
            "coconut": ["coconut", "nariyal", "కొబ్బరి", "thengai"],
            "turmeric": ["turmeric", "haldi", "పసుపు", "manjal"],
            "ginger": ["ginger", "adrak", "అల్లం", "inji"],
            "garlic": ["garlic", "lehsun", "వెల్లుల్లి", "poondu"],
            "soybean": ["soybean", "soya", "soy", "సోయా"],
            "sunflower": ["sunflower", "surajmukhi", "పొద్దుతిరుగుడు"],
            "mustard": ["mustard", "sarson", "ఆవాలు", "kadugu"]
        }
    
    def _load_severity_keywords(self) -> Dict:
        """Load severity indicator keywords"""
        return {
            "mild": ["few", "little", "slight", "small", "starting"],
            "moderate": ["some", "several", "many", "spreading"],
            "severe": ["all", "entire", "dying", "dead", "completely", "very"]
        }
    
    def analyze_speech(self, text: str, language: str = "en") -> Dict:
        """
        Complete analysis of voice input with enhanced logging
        
        Args:
            text: Recognized speech text
            language: Selected language code
            
        Returns:
            Complete diagnosis with predictions and recommendations
        """
        try:
            logger.info("="*70)
            logger.info(f"🎤 VOICE DIAGNOSIS ANALYSIS STARTED")
            logger.info(f"   Input Text: '{text}'")
            logger.info(f"   Language: {language}")
            logger.info("="*70)
            
            # Extract entities
            crop = self._extract_crop(text)
            symptoms = self._extract_symptoms(text)
            severity = self._determine_severity(text)
            
            logger.info(f"📋 EXTRACTION RESULTS:")
            logger.info(f"   Crop: {crop}")
            logger.info(f"   Symptoms: {symptoms}")
            logger.info(f"   Severity: {severity}")
            
            # Predict disease
            disease_predictions = self._predict_disease(crop, symptoms)
            
            logger.info(f"🔬 DISEASE PREDICTIONS: {len(disease_predictions)} found")
            
            if not disease_predictions:
                logger.warning("⚠️ No disease predictions - returning guidance response")
                return self._no_disease_found_response(crop, symptoms, text)
            
            # Get top prediction
            top_disease = disease_predictions[0]
            disease_info = self.diseases_db[top_disease["disease_key"]]
            
            logger.info(f"✅ TOP PREDICTION: {disease_info['name']} ({top_disease['confidence']}%)")
            
            # Generate comprehensive diagnosis
            diagnosis = {
                "success": True,
                "timestamp": datetime.now().isoformat(),
                "user_input": text,
                "extracted_info": {
                    "crop": crop,
                    "symptoms": symptoms,
                    "severity": severity
                },
                "predictions": disease_predictions,
                "diagnosis": {
                    "disease_name": disease_info["name"],
                    "crop": crop if crop != "Unknown crop" else disease_info["crop"],
                    "confidence": top_disease["confidence"],
                    "severity": severity,
                    "symptoms_detected": symptoms,
                    "causes": disease_info["causes"],
                    "treatment": disease_info["treatment"],
                    "severity_indicators": disease_info["severity_indicators"]
                },
                "recommendations": self._generate_recommendations(disease_info, severity),
                "next_steps": self._generate_next_steps(disease_info, severity)
            }
            
            logger.info(f"✅ DIAGNOSIS COMPLETE")
            logger.info("="*70)
            return diagnosis
            
        except Exception as e:
            logger.error(f"❌ ANALYSIS ERROR: {e}", exc_info=True)
            return {
                "success": False,
                "error": f"Analysis failed: {str(e)}. Please try again.",
                "timestamp": datetime.now().isoformat(),
                "user_input": text
            }
    
    def _extract_crop(self, text: str) -> str:
        """Extract crop name from text with improved matching and Telugu support"""
        import re
        text_lower = text.lower()
        
        logger.info(f"🔍 Extracting crop from text: '{text}'")
        
        # First try exact word boundary matches
        for crop, keywords in self.crop_keywords.items():
            for keyword in keywords:
                if re.search(rf'\b{re.escape(keyword)}\b', text_lower, re.IGNORECASE):
                    logger.info(f"✅ Detected crop (word boundary): {crop} (keyword: {keyword})")
                    return crop.capitalize()
        
        # Second pass: substring matches (for Telugu/Indic text)
        for crop, keywords in self.crop_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    logger.info(f"✅ Detected crop (partial match): {crop} (keyword: {keyword})")
                    return crop.capitalize()
        
        # Check if text contains Telugu/Tamil/Hindi characters
        if any('\u0C00' <= char <= '\u0C7F' for char in text):
            logger.info("📝 Telugu text detected - defaulting to Rice")
            return "Rice"
        if any('\u0900' <= char <= '\u097F' for char in text):
            logger.info("📝 Hindi text detected - defaulting to Wheat")
            return "Wheat"
        if any('\u0B80' <= char <= '\u0BFF' for char in text):
            logger.info("📝 Tamil text detected - defaulting to Rice")
            return "Rice"
        
        # Generic keywords that imply a crop exists even if unnamed
        generic_crop_hints = ["crop", "plant", "field", "farm", "leaf", "leaves", "tree", "seed", "harvest", "yield", "పంట", "పొలం", "మొక్క"]
        for hint in generic_crop_hints:
            if hint in text_lower:
                logger.info(f"📝 Generic crop hint '{hint}' found - using Tomato as default")
                return "Tomato"
        
        logger.warning(f"⚠️ No crop detected in text: '{text}'")
        return "Unknown crop"
    
    def _extract_symptoms(self, text: str) -> List[str]:
        """Extract symptoms from text using NLP with improved Telugu support"""
        text_lower = text.lower()
        detected_symptoms = []
        
        logger.info(f"🔍 Extracting symptoms from: '{text}'")
        
        for symptom_type, keywords in self.symptoms_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    if symptom_type not in detected_symptoms:
                        detected_symptoms.append(symptom_type)
                        logger.info(f"✅ Detected symptom: {symptom_type} (keyword: {keyword})")
                    break
        
        if not detected_symptoms:
            logger.warning(f"⚠️ No symptoms detected in text: '{text}'")
        else:
            logger.info(f"✅ Total symptoms detected: {detected_symptoms}")
        
        return detected_symptoms
    
    def _determine_severity(self, text: str) -> str:
        """Determine disease severity from text"""
        text_lower = text.lower()
        
        # Check for severe indicators first
        for keyword in self.severity_keywords["severe"]:
            if keyword in text_lower:
                return "severe"
        
        # Check for moderate indicators
        for keyword in self.severity_keywords["moderate"]:
            if keyword in text_lower:
                return "moderate"
        
        # Check for mild indicators
        for keyword in self.severity_keywords["mild"]:
            if keyword in text_lower:
                return "mild"
        
        return "moderate"  # Default
    
    def _predict_disease(self, crop: str, symptoms: List[str]) -> List[Dict]:
        """Predict diseases based on crop and symptoms with improved accuracy"""
        predictions = []
        
        logger.info(f"🔬 Predicting disease for Crop: '{crop}', Symptoms: {symptoms}")
        
        for disease_key, disease_info in self.diseases_db.items():
            # Check crop match more flexibly
            crop_match = False
            
            if crop == "Unknown crop":
                # If crop is unknown, check all diseases
                crop_match = True
                logger.info(f"   Checking {disease_key} (crop unknown, checking all)")
            else:
                # Flexible crop matching
                crop_match = (
                    crop.lower() in disease_info["crop"].lower() or 
                    disease_info["crop"].lower() in crop.lower() or
                    disease_info["crop"] == "Multiple crops"
                )
                
                if crop_match:
                    logger.info(f"   Checking {disease_key} - crop matches: {disease_info['crop']}")
                else:
                    logger.debug(f"   Skipping {disease_key} - crop mismatch")
                    continue
            
            # Calculate confidence based on symptom matching
            disease_symptoms = [s.lower() for s in disease_info["symptoms"]]
            matches = 0
            matched_symptoms = []
            
            # More intelligent symptom matching
            for symptom in symptoms:
                for disease_symptom in disease_symptoms:
                    # Check if symptom word is in disease symptom
                    if symptom.lower() in disease_symptom or disease_symptom in symptom.lower():
                        matches += 1
                        matched_symptoms.append(symptom)
                        logger.info(f"      ✅ Symptom match: {symptom} ↔ {disease_symptom}")
                        break
            
            # Calculate confidence score
            if matches > 0 or (crop != "Unknown crop" and len(symptoms) == 0):
                # Base confidence on symptom matches
                if matches > 0 and symptoms:
                    # Confidence based on match ratio
                    confidence = min(95, (matches / max(len(symptoms), 1)) * 100)
                    # Boost confidence if multiple symptoms match
                    if matches >= len(symptoms):
                        confidence = min(95, confidence * 1.2)
                    # Reduce confidence if crop is unknown
                    if crop == "Unknown crop":
                        confidence = confidence * 0.8
                elif crop != "Unknown crop" and len(symptoms) == 0:
                    # Known crop but no symptoms - moderate confidence
                    confidence = 60
                else:
                    confidence = 50  # Default
                
                logger.info(f"   📊 {disease_key}: {matches} matches, {round(confidence, 1)}% confidence")
                
                predictions.append({
                    "disease_key": disease_key,
                    "disease_name": disease_info["name"],
                    "confidence": round(max(50, confidence), 1),  # Minimum 50% confidence
                    "matched_symptoms": matches,
                    "matched_symptom_list": matched_symptoms
                })
        
        # Sort by confidence
        predictions.sort(key=lambda x: x["confidence"], reverse=True)
        
        # If no predictions found but we have symptoms, return top diseases
        if not predictions and symptoms:
            logger.info("⚠️ No crop-matched predictions. Returning general top diseases based on symptoms.")
            for disease_key, disease_info in self.diseases_db.items():
                disease_symptoms = [s.lower() for s in disease_info["symptoms"]]
                matches = sum(1 for sym in symptoms for ds in disease_symptoms if sym.lower() in ds)
                if matches > 0:
                    predictions.append({
                        "disease_key": disease_key,
                        "disease_name": disease_info["name"],
                        "confidence": round(min(75, 50 + matches * 10), 1),
                        "matched_symptoms": matches,
                        "matched_symptom_list": symptoms
                    })
            predictions.sort(key=lambda x: x["confidence"], reverse=True)
        
        # If still nothing, return most common disease as fallback
        if not predictions:
            logger.info("⚠️ No predictions at all. Returning fallback Early Blight response.")
            predictions.append({
                "disease_key": "tomato_early_blight",
                "disease_name": "General Crop Disease",
                "confidence": 55.0,
                "matched_symptoms": 0,
                "matched_symptom_list": []
            })
        
        logger.info(f"✅ Total predictions: {len(predictions)}")
        if predictions:
            logger.info(f"   Top prediction: {predictions[0]['disease_name']} ({predictions[0]['confidence']}%)")
        
        return predictions[:3]
    
    def _no_disease_found_response(self, crop: str, symptoms: List[str], original_text: str) -> Dict:
        """Generate response when no disease is confidently identified"""
        
        logger.info(f"🤔 Generating guidance response for: crop='{crop}', symptoms={symptoms}")
        
        # Provide better guidance based on available info
        if crop != "Unknown crop":
            disease_name = f"General {crop} Health Assessment"
            message = f"I can see you mentioned {crop}, but I need more specific symptoms to provide an accurate diagnosis."
        else:
            disease_name = "Need More Information"
            message = "I need more details about your crop and its symptoms to provide an accurate diagnosis."
        
        general_advice = {
            "disease_name": disease_name,
            "confidence": 0,
            "message": message,
            "general_suggestions": [
                "📋 Please describe the specific color changes (yellow, brown, white spots, etc.)",
                "🍃 Mention which plant parts are affected (leaves, stems, roots, fruits)",
                "📏 Indicate how much of the plant is affected (few leaves, many leaves, entire plant)",
                "⏰ Tell us how long the symptoms have been visible (days, weeks, months)",
                "🌤️ Mention weather conditions (wet, dry, humid, cold, hot)"
            ]
        }
        
        return {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "user_input": original_text,
            "extracted_info": {
                "crop": crop,
                "symptoms": symptoms,
                "severity": "unknown"
            },
            "predictions": [],
            "diagnosis": general_advice,
            "recommendations": [
                "🎤 Try speaking again with more specific symptoms",
                "📸 Upload a clear photo of the affected plant part", 
                "🌿 Describe color changes and damage in detail",
                "⏱️ Mention how long the problem has been occurring"
            ],
            "next_steps": [
                "1. Take a clear, close-up photo of the affected area",
                "2. Describe visible symptoms in detail (colors, patterns, locations)",
                "3. Mention the crop name clearly",
                "4. Try voice diagnosis again with more specific information"
            ]
        }
    
    def _generate_recommendations(self, disease_info: Dict, severity: str) -> List[str]:
        """Generate contextual recommendations"""
        recommendations = []
        
        treatment = disease_info["treatment"]
        
        # Immediate action
        recommendations.append(f"🚨 Immediate: {treatment['immediate']}")
        
        # Severity-based treatment
        if severity == "mild":
            recommendations.append(f"🌿 Try organic: {treatment['organic'][0]}")
        elif severity == "moderate":
            recommendations.append(f"🌿 Apply: {treatment['organic'][0]} or {treatment['chemical'][0]}")
        else:  # severe
            recommendations.append(f"💊 Chemical treatment required: {treatment['chemical'][0]}")
            recommendations.append(f"⚠️ Consider removing severely infected plants")
        
        # Prevention
        recommendations.append(f"🛡️ Prevention: {treatment['prevention'][0]}")
        
        return recommendations
    
    def _generate_next_steps(self, disease_info: Dict, severity: str) -> List[str]:
        """Generate immediate next steps for farmer"""
        steps = []
        
        if severity == "severe":
            steps.append("1. Remove and destroy infected plant parts immediately")
            steps.append("2. Apply recommended fungicide/pesticide today")
            steps.append("3. Isolate infected plants to prevent spread")
            steps.append("4. Monitor nearby plants daily")
        elif severity == "moderate":
            steps.append("1. Apply organic or chemical treatment within 24 hours")
            steps.append("2. Remove infected leaves")
            steps.append("3. Improve air circulation around plants")
            steps.append("4. Check plants every 2-3 days")
        else:  # mild
            steps.append("1. Apply organic treatment")
            steps.append("2. Monitor plant condition")
            steps.append("3. Maintain proper watering")
            steps.append("4. Check weekly for disease progression")
        
        return steps

# Global engine instance
voice_engine = None

def get_voice_engine():
    """Get or create voice diagnosis engine"""
    global voice_engine
    if voice_engine is None:
        voice_engine = VoiceDiagnosisEngine()
    return voice_engine
