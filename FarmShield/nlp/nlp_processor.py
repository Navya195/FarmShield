import os
import json
import re

try:
    import nltk
    from nltk.tokenize import word_tokenize
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    NLTK_AVAILABLE = True
except ImportError:
    NLTK_AVAILABLE = False

class FarmShieldNLP:
    def __init__(self, knowledge_base_path=None):
        self.knowledge_base = []
        self.nltk_initialized = NLTK_AVAILABLE
        
        if NLTK_AVAILABLE:
            try:
                self.lemmatizer = WordNetLemmatizer()
                self.stop_words = set(stopwords.words('english'))
            except Exception:
                self.nltk_initialized = False
                
        if knowledge_base_path and os.path.exists(knowledge_base_path):
            self.load_knowledge_base(knowledge_base_path)
        else:
            self._load_fallback_knowledge()
            
        self._prepare_vectorizer()

    def load_knowledge_base(self, path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.knowledge_base = data.get("knowledge", [])
            print(f"[NLP] Loaded {len(self.knowledge_base)} knowledge items.")
        except Exception as e:
            print(f"[NLP] Error loading knowledge base: {e}")
            self._load_fallback_knowledge()

    def _load_fallback_knowledge(self):
        self.knowledge_base = [
            {
                "intent": "leaf_yellowing",
                "patterns": ["yellow leaves", "leaves turning yellow", "yellowing", "chlorosis", "pale leaves"],
                "responses": [
                    "Yellowing of leaves (chlorosis) usually points to nitrogen deficiency or moisture imbalance. Ensure proper watering and apply nitrogen-rich fertilizer like ammonium sulfate or organic compost."
                ],
                "crops": ["tomato", "rice", "wheat", "corn", "apple"]
            },
            {
                "intent": "fertilizer_recommendation",
                "patterns": ["best fertilizer", "what fertilizer to use", "fertilizer recommendations", "nutrients", "manure"],
                "responses": [
                    "For healthy plant growth: Tomatoes need high phosphorus initially, then potassium-rich fertilizer. Corn is a heavy nitrogen feeder. Always balance NPK ratios and incorporate organic matter."
                ],
                "crops": ["all"]
            },
            {
                "intent": "disease_treatment",
                "patterns": ["treat disease", "cure disease", "control infection", "remedy", "sprays"],
                "responses": [
                    "Disease treatment requires accurate diagnosis. For fungal blights, copper-based fungicides are highly effective organic treatments. Ensure you prune infected branches to stop spread."
                ],
                "crops": ["all"]
            },
            {
                "intent": "watering_schedule",
                "patterns": ["how much water", "irrigation schedule", "watering frequency", "how often to water"],
                "responses": [
                    "Watering frequency depends on soil type and weather. As a rule, water deeply when the top 2 inches of soil feels dry. Drip irrigation is highly recommended to prevent foliage dampness."
                ],
                "crops": ["all"]
            },
            {
                "intent": "pest_control",
                "patterns": ["bugs", "insects", "pests", "worms", "aphids", "whiteflies", "caterpillars"],
                "responses": [
                    "For soft-bodied insects like aphids and whiteflies, use horticultural soap or neem oil spray. For caterpillars, Bacillus thuringiensis (Bt) is a safe biological control agent."
                ],
                "crops": ["all"]
            }
        ]

    def _prepare_vectorizer(self):
        if not self.nltk_initialized:
            return
            
        self.corpus = []
        self.corpus_intents = []
        
        for item in self.knowledge_base:
            for pattern in item["patterns"]:
                self.corpus.append(self.preprocess(pattern))
                self.corpus_intents.append(item)
                
        if self.corpus:
            try:
                self.vectorizer = TfidfVectorizer()
                self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus)
            except Exception as e:
                print(f"[NLP] Vectorizer error: {e}")
                self.nltk_initialized = False

    def preprocess(self, text):
        text = text.lower()
        text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
        
        if not self.nltk_initialized:
            return text
            
        tokens = word_tokenize(text)
        cleaned_tokens = [
            self.lemmatizer.lemmatize(token) 
            for token in tokens 
            if token not in self.stop_words
        ]
        
        return " ".join(cleaned_tokens)

    def process_query(self, query, context_crop=None):
        if not query:
            return {
                "intent": "empty",
                "response": "Please enter a valid farming question.",
                "confidence": 0.0,
                "crop": context_crop
            }
            
        query_processed = self.preprocess(query)
        
        if not self.nltk_initialized or not self.corpus:
            for item in self.knowledge_base:
                for pattern in item["patterns"]:
                    if pattern in query.lower():
                        return self._format_response(item, query, context_crop, 0.70)
            return self._fallback_response(query, context_crop)
            
        try:
            query_vector = self.vectorizer.transform([query_processed])
            similarities = cosine_similarity(query_vector, self.tfidf_matrix).flatten()
            
            best_idx = np.argmax(similarities)
            max_similarity = similarities[best_idx]
            
            if max_similarity > 0.25:
                matched_item = self.corpus_intents[best_idx]
                return self._format_response(matched_item, query, context_crop, max_similarity)
            else:
                return self._fallback_response(query, context_crop)
                
        except Exception as e:
            print(f"[NLP] Processing failed: {e}")
            return self._fallback_response(query, context_crop)

    def _format_response(self, item, query, crop, confidence):
        response_template = item["responses"][0]
        
        final_response = response_template
        if "{crop}" in response_template:
            final_response = response_template.replace("{crop}", (crop or "your crop").capitalize())
            
        return {
            "intent": item["intent"],
            "response": final_response,
            "confidence": float(confidence),
            "crop": crop
        }

    def _fallback_response(self, query, crop):
        crop_msg = f" for {crop}" if crop else ""
        return {
            "intent": "fallback",
            "response": f"I appreciate your question regarding '{query}'{crop_msg}. While I'm still learning the specifics of this query, please consider consulting your local Krishi Vigyan Kendra (KVK) for specialized advice, or check our disease diagnosis upload tool above.",
            "confidence": 0.0,
            "crop": crop
        }