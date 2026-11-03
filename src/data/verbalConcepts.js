export const verbalConcepts = [
  {
    id: "analogy",
    title: "Verbal Analogy",
    description: "Analogy questions test your ability to recognize relationships between pairs of words and apply that logic to find a matching pair.",
    strategies: [
      "**Formulate a Bridge Sentence:** Create a clear, specific sentence expressing the relationship between the first pair of words. Then, test the options with the exact same sentence.",
      "**Check Part of Speech:** The relationship must match parts of speech. If the first pair is Noun:Verb, the answer should generally preserve that relationship or order.",
      "**Refine the Relationship:** If multiple options fit, make your bridge sentence more specific. E.g., instead of 'A hammer is a tool', write 'A hammer is a tool used for driving nails'."
    ],
    examples: [
      {
        pair: "SCALPEL : SURGEON",
        options: ["pen : writer", "lens : photographer", "hammer : carpenter", "magnet : physicist"],
        correct: "hammer : carpenter",
        explanation: "A scalpel is the primary tool used by a surgeon to perform their work. Similarly, a hammer is the primary tool used by a carpenter to perform their work. (While a pen is used by a writer, a writer doesn't primarily do manual craftsmanship in the same direct physical way, making hammer:carpenter the strongest parallel. Also, a lens is a component of a camera, not a standalone tool like a scalpel or hammer)."
      }
    ]
  },
  {
    id: "sentence-completion",
    title: "Sentence Completion",
    description: "Sentence completion tests vocabulary and context-matching, where you fill in one or two blanks to make the sentence logical.",
    strategies: [
      "**Analyze Transition Words:** Look for words like *although, because, therefore, but, however*. They indicate if the blank supports the first clause (agreement) or contradicts it (contrast).",
      "**Pre-fill the Blanks:** Before looking at the options, guess a word that fits the context. Compare your guess with the choices.",
      "**Two-Blank Strategy:** Test the first word of each option. Eliminate choices that make no sense, then test both words for remaining options."
    ],
    examples: [
      {
        sentence: "Although the professor's lectures were notoriously _______, his students found his personal anecdotes highly _______.",
        options: [
          "engaging ... tedious",
          "lengthy ... boring",
          "dry ... entertaining",
          "difficult ... perplexing"
        ],
        correct: "dry ... entertaining",
        explanation: "The word 'Although' signals contrast. We need opposite tones. 'dry' (negative/boring lectures) contrasts with 'entertaining' (positive personal anecdotes). Option A has positive ... negative, which is opposite to what is implied by 'lectures were notoriously [bad] ... anecdotes [good]'. Option C fits perfectly."
      }
    ]
  },
  {
    id: "contextual-error",
    title: "Contextual Error (Odd Word Out)",
    description: "Contextual error questions present a sentence where one highlighted word is semantically incorrect and violates the logic of the sentence.",
    strategies: [
      "**Ignore Spelling and Grammar:** GAT contextual errors are almost always semantic (meaning-based), not grammatical or spelling mistakes.",
      "**Read for Flow and Consistency:** Ensure the sentence maintains a logical point. If a sentence is praising a subject, a negative word is likely the error.",
      "**Substitute Opposites:** Once you suspect a word is incorrect, try replacing it with its antonym. If it resolves the logic, you've found the error!"
    ],
    examples: [
      {
        sentence: "With the rise of renewable energy, fossil fuels are becoming more popular, leading to a decline in coal extraction.",
        options: ["rise", "fossil", "popular", "decline"],
        correct: "popular",
        explanation: "If renewable energy is rising, fossil fuels should become *less* popular (or obsolete), which aligns with the 'decline in coal extraction'. Thus, 'popular' is the contextual error. It should be replaced with 'unpopular' or 'scarce'."
      }
    ]
  },
  {
    id: "reading-comprehension",
    title: "Reading Comprehension",
    description: "Reading comprehension evaluates your ability to read passages, understand main ideas, extract details, and draw inferences.",
    strategies: [
      "**Skim First:** Read the passage quickly to capture the main theme and structure. Note where key terms appear.",
      "**Read the Question Stems:** Identify what is asked (e.g., 'according to paragraph 2' vs. 'the author implies...').",
      "**Locate Evidence:** Go back to the text and find the exact sentence addressing the question. GAT answers are always supported by the text, not external assumptions."
    ],
    examples: [
      {
        passage: "The atmosphere of Mars is extremely thin, composed of 95% carbon dioxide. Because of this thin atmosphere, liquid water cannot exist on the surface for long, as it would quickly vaporize. However, radar data suggests that liquid water reservoirs may lie deep beneath the polar ice caps.",
        question: "According to the passage, liquid water does not remain on the surface of Mars because:",
        options: [
          "It is absorbed by the carbon dioxide.",
          "The low atmospheric density causes it to evaporate rapidly.",
          "The temperature is always below freezing.",
          "Deep underground reservoirs draw water away from the surface."
        ],
        correct: "The low atmospheric density causes it to evaporate rapidly.",
        explanation: "The passage states that 'Because of this thin atmosphere, liquid water cannot exist... as it would quickly vaporize.' A thin atmosphere refers to low density, and vaporizing refers to evaporating."
      }
    ]
  }
];
