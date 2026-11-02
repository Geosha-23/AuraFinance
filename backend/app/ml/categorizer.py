import re
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.pipeline import Pipeline

CATEGORIES = [
    "Food & Dining",
    "Travel & Commute",
    "Shopping & E-Commerce",
    "Subscriptions & Streaming",
    "Utilities & Bills",
    "Education & Books",
    "Entertainment & Outings",
    "Healthcare & Fitness",
    "Groceries & Essentials",
    "Other & Miscellaneous"
]

# Robust curated training corpus tailored for college student & young professional expenditure
TRAINING_DATA = [
    # Food & Dining
    ("Swiggy order biryani lunch", "Food & Dining"),
    ("Zomato dinner delivery pizza burger", "Food & Dining"),
    ("Starbucks iced latte coffee", "Food & Dining"),
    ("McDonalds happy meal french fries burger", "Food & Dining"),
    ("Chai Point tea and samosa canteen", "Food & Dining"),
    ("College canteen noodles and coffee", "Food & Dining"),
    ("Dominos pizza party night", "Food & Dining"),
    ("KFC fried chicken wings", "Food & Dining"),
    ("Subway paneer tikka sub", "Food & Dining"),
    ("Haldiram snacks thali lunch", "Food & Dining"),
    ("Cafe Coffee Day hot chocolate", "Food & Dining"),
    ("Burger King whopper meal", "Food & Dining"),
    ("Local dhaba paneer butter masala roti", "Food & Dining"),
    ("Tiffin service monthly food mess fee", "Food & Dining"),
    ("Barbeque Nation buffet dinner", "Food & Dining"),
    ("Sweet shop gulab jamun bakery cake", "Food & Dining"),
    ("Tea stall tapri cutting chai bun maska", "Food & Dining"),
    ("Hostel mess food coupon payment", "Food & Dining"),
    ("Waffle bites and pancake dessert", "Food & Dining"),
    ("Ice cream parlour scoop naturals", "Food & Dining"),

    # Travel & Commute
    ("Uber cab ride to college campus", "Travel & Commute"),
    ("Ola auto ride to hostel", "Travel & Commute"),
    ("Rapido bike taxi metro station", "Travel & Commute"),
    ("Metro smart card recharge", "Travel & Commute"),
    ("IRCTC train ticket booking holiday", "Travel & Commute"),
    ("MakeMyTrip flight ticket airport", "Travel & Commute"),
    ("RedBus interstate bus ticket travel", "Travel & Commute"),
    ("Petrol pump Indian Oil fuel motorcycle", "Travel & Commute"),
    ("Bharat Petroleum diesel scooter fuel", "Travel & Commute"),
    ("Auto rickshaw meter fare local", "Travel & Commute"),
    ("Toll plaza Fastag electronic toll", "Travel & Commute"),
    ("Parking fee mall campus", "Travel & Commute"),
    ("Bicycle rental puncture repair", "Travel & Commute"),
    ("Indigo airlines baggage seat charge", "Travel & Commute"),

    # Shopping & E-Commerce
    ("Amazon order wireless mouse electronics", "Shopping & E-Commerce"),
    ("Flipkart sale headphones earphones", "Shopping & E-Commerce"),
    ("Myntra casual denim jeans shirt", "Shopping & E-Commerce"),
    ("Ajio sneakers shoes sportswear", "Shopping & E-Commerce"),
    ("Zara cotton t-shirt hoodie", "Shopping & E-Commerce"),
    ("H&M sunglasses jacket winter wear", "Shopping & E-Commerce"),
    ("Nykaa skincare sunscreen face wash", "Shopping & E-Commerce"),
    ("Croma electronic charger adapter cable", "Shopping & E-Commerce"),
    ("Decathlon sports gym bag yoga mat", "Shopping & E-Commerce"),
    ("Shoppers Stop perfume watch", "Shopping & E-Commerce"),
    ("Lenskart spectacles blue cut glasses", "Shopping & E-Commerce"),
    ("Apple Store macbook case protective sleeve", "Shopping & E-Commerce"),

    # Subscriptions & Streaming
    ("Netflix monthly premium 4k subscription", "Subscriptions & Streaming"),
    ("Spotify family music stream plan", "Subscriptions & Streaming"),
    ("YouTube Premium ad-free subscription", "Subscriptions & Streaming"),
    ("Amazon Prime annual membership delivery", "Subscriptions & Streaming"),
    ("Disney Hotstar super plan cricket match", "Subscriptions & Streaming"),
    ("Apple iCloud 50gb storage monthly bill", "Subscriptions & Streaming"),
    ("Google One 100gb drive cloud storage", "Subscriptions & Streaming"),
    ("ChatGPT Plus OpenAI monthly subscription", "Subscriptions & Streaming"),
    ("GitHub Copilot developer student pack", "Subscriptions & Streaming"),
    ("Medium membership tech articles blog", "Subscriptions & Streaming"),
    ("Audible audiobook monthly credit", "Subscriptions & Streaming"),
    ("Sony LIV annual subscription movies", "Subscriptions & Streaming"),

    # Utilities & Bills
    ("Airtel postpaid mobile recharge unlimited", "Utilities & Bills"),
    ("Jio prepaid recharge 5G data voucher", "Utilities & Bills"),
    ("Electricity board BESCOM power bill", "Utilities & Bills"),
    ("ACT Fibernet broadband wifi fiber monthly bill", "Utilities & Bills"),
    ("Water supply tank municipal bill", "Utilities & Bills"),
    ("Indane LPG cooking gas cylinder refill", "Utilities & Bills"),
    ("Hostel room maintenance electricity fee", "Utilities & Bills"),
    ("Tata Play DTH set top box recharge", "Utilities & Bills"),
    ("Piped natural gas bill payment", "Utilities & Bills"),

    # Education & Books
    ("Coursera machine learning certification course", "Education & Books"),
    ("Udemy full stack web development bootcamp", "Education & Books"),
    ("College semester exam registration fee", "Education & Books"),
    ("Engineering mathematics textbook book depot", "Education & Books"),
    ("Stationery notebooks pens spiral binding xerox", "Education & Books"),
    ("Library card fine renewal book lending", "Education & Books"),
    ("Photocopy shop notes printing assignment", "Education & Books"),
    ("Kindle ebook computer programming algorithms", "Education & Books"),
    ("GRE IELTS test preparation mock exam", "Education & Books"),
    ("Hackathon registration team entry fee", "Education & Books"),

    # Entertainment & Outings
    ("PVR Cinemas movie ticket popcorn cold drink", "Entertainment & Outings"),
    ("INOX multiplex weekend movie show", "Entertainment & Outings"),
    ("BookMyShow comedy club standup show ticket", "Entertainment & Outings"),
    ("Bowling alley game arcade timezone", "Entertainment & Outings"),
    ("Amusement park water world entry pass", "Entertainment & Outings"),
    ("Escape room challenge campus friends", "Entertainment & Outings"),
    ("Steam video game purchase counter strike", "Entertainment & Outings"),
    ("Playstation network store digital game", "Entertainment & Outings"),
    ("Club entry weekend DJ party cover charge", "Entertainment & Outings"),
    ("Concert music festival pass live performance", "Entertainment & Outings"),

    # Healthcare & Fitness
    ("Apollo pharmacy medicine paracetamol syrup", "Healthcare & Fitness"),
    ("Doctor consultation fee clinic appointment", "Healthcare & Fitness"),
    ("Cult.fit gym quarterly membership workout", "Healthcare & Fitness"),
    ("Gold Gym personal trainer protein shaker", "Healthcare & Fitness"),
    ("Dentist teeth cleaning dental filling", "Healthcare & Fitness"),
    ("Optometrist eye checkup contact lenses", "Healthcare & Fitness"),
    ("1mg diagnostic blood test lab report", "Healthcare & Fitness"),
    ("Vitamin C D3 multivitamin supplements", "Healthcare & Fitness"),
    ("First aid kit band aid antiseptic cream", "Healthcare & Fitness"),

    # Groceries & Essentials
    ("Blinkit quick delivery milk eggs bread butter", "Groceries & Essentials"),
    ("Zepto groceries fruits vegetables onions", "Groceries & Essentials"),
    ("BigBasket monthly supermarket kitchen supplies", "Groceries & Essentials"),
    ("Local vegetable vendor sabzi mandi fruits", "Groceries & Essentials"),
    ("D-Mart supermarket detergent dish soap toothpaste", "Groceries & Essentials"),
    ("Nature Basket dry fruits almonds cashews", "Groceries & Essentials"),
    ("Shampoo soap body wash personal hygiene", "Groceries & Essentials"),
    ("Drinking water 20L can delivery", "Groceries & Essentials"),
    ("Snacks biscuits namkeen wafers instant maggi", "Groceries & Essentials"),

    # Other & Miscellaneous
    ("ATM cash withdrawal currency notes", "Other & Miscellaneous"),
    ("Bank service charge SMS alert fee penalty", "Other & Miscellaneous"),
    ("Laundry dry cleaning iron clothes hostel", "Other & Miscellaneous"),
    ("Courier speed post parcel delivery charges", "Other & Miscellaneous"),
    ("Room key duplicate locksmith lock padlock", "Other & Miscellaneous"),
    ("Gift card birthday present friend", "Other & Miscellaneous"),
    ("Charity donation relief fund", "Other & Miscellaneous")
]

class TransactionCategorizer:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1,
            token_pattern=r"(?u)\b\w+\b"
        )
        self.classifier = SGDClassifier(
            loss="log_loss",
            penalty="l2",
            alpha=1e-4,
            max_iter=1000,
            random_state=42
        )
        self.is_trained = False
        self._train_initial_model()

    def _clean_text(self, text: str) -> str:
        text = text.lower()
        # Remove numbers and punctuation but keep alphanumeric tokens
        text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
        return " ".join(text.split())

    def _train_initial_model(self):
        texts = [self._clean_text(item[0]) for item in TRAINING_DATA]
        labels = [item[1] for item in TRAINING_DATA]
        
        X = self.vectorizer.fit_transform(texts)
        self.classifier.fit(X, labels)
        self.is_trained = True
        print(f"[ML Categorizer] Pre-trained with {len(TRAINING_DATA)} reference transactions across {len(CATEGORIES)} categories.")

    def predict(self, description: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """
        Predicts category and returns confidence score + alternatives.
        """
        if not description or not description.strip():
            return {
                "category": "Other & Miscellaneous",
                "confidence": 0.5,
                "alternative_categories": []
            }

        cleaned = self._clean_text(description)
        X = self.vectorizer.transform([cleaned])
        
        probabilities = self.classifier.predict_proba(X)[0]
        classes = self.classifier.classes_
        
        # Sort by probability descending
        sorted_indices = np.argsort(probabilities)[::-1]
        top_category = str(classes[sorted_indices[0]])
        top_prob = float(probabilities[sorted_indices[0]])

        # Rule heuristics for high-certainty keywords
        desc_lower = description.lower()
        if any(w in desc_lower for w in ["netflix", "spotify", "hotstar", "prime video", "youtube premium", "icloud", "chatgpt"]):
            top_category = "Subscriptions & Streaming"
            top_prob = max(top_prob, 0.95)
        elif any(w in desc_lower for w in ["swiggy", "zomato", "biryani", "canteen", "starbucks", "mcdonald", "burger", "pizza", "chai"]):
            top_category = "Food & Dining"
            top_prob = max(top_prob, 0.92)
        elif any(w in desc_lower for w in ["uber", "ola", "rapido", "metro", "irctc", "petrol", "diesel", "fastag"]):
            top_category = "Travel & Commute"
            top_prob = max(top_prob, 0.93)
        elif any(w in desc_lower for w in ["amazon", "flipkart", "myntra", "ajio", "zara", "h&m"]):
            top_category = "Shopping & E-Commerce"
            top_prob = max(top_prob, 0.90)
        elif any(w in desc_lower for w in ["recharge", "airtel", "jio", "electricity", "broadband", "bescom", "wifi"]):
            top_category = "Utilities & Bills"
            top_prob = max(top_prob, 0.92)
        elif any(w in desc_lower for w in ["coursera", "udemy", "textbook", "xerox", "photocopy", "stationery", "exam fee"]):
            top_category = "Education & Books"
            top_prob = max(top_prob, 0.91)
        elif any(w in desc_lower for w in ["pvr", "inox", "movie", "cinema", "bookmyshow", "arcade", "bowling"]):
            top_category = "Entertainment & Outings"
            top_prob = max(top_prob, 0.92)
        elif any(w in desc_lower for w in ["blinkit", "zepto", "bigbasket", "groceries", "supermarket", "d-mart"]):
            top_category = "Groceries & Essentials"
            top_prob = max(top_prob, 0.92)
        elif any(w in desc_lower for w in ["pharmacy", "doctor", "gym", "medicine", "cult.fit"]):
            top_category = "Healthcare & Fitness"
            top_prob = max(top_prob, 0.92)

        alternatives = []
        for idx in sorted_indices[1:4]:
            cat_name = str(classes[idx])
            if cat_name != top_category:
                alternatives.append({
                    "category": cat_name,
                    "confidence": round(float(probabilities[idx]), 3)
                })

        return {
            "category": top_category,
            "confidence": round(top_prob, 3),
            "alternative_categories": alternatives
        }

    def learn_incremental(self, description: str, corrected_category: str):
        """
        User feedback loop: incrementally trains the classifier with user's verified correction.
        """
        if corrected_category not in CATEGORIES:
            return
        cleaned = self._clean_text(description)
        X = self.vectorizer.transform([cleaned])
        self.classifier.partial_fit(X, [corrected_category])

categorizer = TransactionCategorizer()
