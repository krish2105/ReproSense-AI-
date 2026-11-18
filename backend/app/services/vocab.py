"""The fixed log vocabulary: the only values a log entry (and the sentence reader) may use."""

FLOWS = ("none", "spotting", "light", "medium", "heavy")
SYMPTOMS = {
    "cramps",
    "bloating",
    "fatigue",
    "headache",
    "breast tenderness",
    "low mood",
    "back pain",
    "cravings",
    "acne",
    "excess hair growth",
    "scalp hair thinning",
    "flooding",
    "pain with bowel movements",
    "pain passing urine",
    "dizziness",
    "fainting",
    "fever",
    "hot flushes",
    "night sweats",
    "nausea",
    "anxiety",
    "insomnia",
    "sudden severe pain",
    "severe abdominal pain",
    "reduced baby movements",
    "severe headache",
    "vision changes",
    "bleeding",
    "sudden swelling",  # of the face, hands or feet (NICE NG133 1.1.1); read by RF7 with a blood-pressure reading
}
IMPACTS = ("none", "reduced activity", "missed work or study", "stayed in bed")
