
// src/lib/daily-topics.ts
import type { DailyTopic } from '@/types/daily-topic';

// This is a placeholder for fetching from Firestore.
// In a real app, you'd populate a `dailyTopics` collection in Firestore
// and fetch the topic for the current day.

const sampleDailyTopics: DailyTopic[] = [
  {
    id: 'monday-self-compassion',
    dayOfWeek: 'Monday',
    topicName: 'Cultivating Self-Compassion',
    introduction: "Good morning! Today's guided topic is about **Self-Compassion**. It's about treating ourselves with the same kindness and understanding we'd offer a good friend, especially when we're struggling. Let's explore how you're feeling about this.",
    scaleQuestions: [
      { id: 'q1', text: "I am generally kind and understanding towards myself when I make mistakes or feel inadequate." },
      { id: 'q2', text: "I tend to be quite critical of my own flaws and shortcomings.", reverseScore: true },
      { id: 'q3', text: "When I'm going through a difficult time, I try to give myself the caring and support I need." },
    ],
    scoreRanges: {
      // Assuming 3 questions, scores 1-5. Total score 3-15.
      // Low: 3-7, Medium: 8-11, High: 12-15
      low: { // Scores 3-7
        miraResponse: "It sounds like being consistently kind to yourself might be challenging right now, and that's perfectly okay. Many of us find self-criticism comes more easily than self-kindness. Recognizing this is a brave first step.",
        journalPrompt: "Journal Prompt: Think about a small, specific situation recently where you were hard on yourself. How might you have responded to a friend in the same situation? What's one kind thought you could offer yourself about that moment now?",
        resourceSuggestion: "Consider exploring a 5-minute loving-kindness meditation. You can find many guided versions online."
      },
      medium: { // Scores 8-11
        miraResponse: "It seems you have an awareness of self-compassion and try to practice it, even if it's not always easy. That's a wonderful foundation to build upon. Remember, self-compassion is a practice, not a perfect state.",
        journalPrompt: "Journal Prompt: Reflect on a time you were able to be kind to yourself during a difficult moment. What did that feel like? What made it possible? How could you create more space for that feeling in your life?",
        resourceSuggestion: "Perhaps try dedicating a few minutes each day to notice one kind thing you did for yourself or one moment you acknowledged your feelings without judgment."
      },
      high: { // Scores 12-15
        miraResponse: "That's wonderful! It sounds like you have a strong practice of self-compassion. This is a powerful resource for navigating life's ups and downs with greater resilience and peace.",
        journalPrompt: "Journal Prompt: How does your self-compassion support you in your daily life and relationships? Are there any areas where you could extend this compassion even further, perhaps to aspects of yourself you still find challenging?",
        resourceSuggestion: "You might enjoy reading more about the core components of self-compassion by Dr. Kristin Neff, such as self-kindness, common humanity, and mindfulness."
      },
    },
    generalResource: {
      text: "Learn more about Self-Compassion from Dr. Kristin Neff.",
      link: "https://self-compassion.org/"
    }
  },
  // Add more topics for other days of the week here
  {
    id: 'tuesday-gratitude',
    dayOfWeek: 'Tuesday',
    topicName: 'Finding Gratitude',
    introduction: "Hello! Today, let's focus on **Gratitude**. Taking a moment to appreciate the good things in our lives, big or small, can significantly boost our well-being. How are you feeling about gratitude today?",
    scaleQuestions: [
      { id: 'q1_grat', text: "I regularly take time to appreciate the good things in my life." },
      { id: 'q2_grat', text: "I often find myself focusing on what's lacking rather than what I have.", reverseScore: true },
      { id: 'q3_grat', text: "Expressing gratitude comes naturally to me." },
    ],
    scoreRanges: {
      low: {
        miraResponse: "It can be tough to focus on gratitude when things feel challenging, or if it's not a habit we've cultivated. That's completely understandable. Even small steps can make a difference.",
        journalPrompt: "Journal Prompt: Today, try to identify just one small thing you are grateful for – it could be as simple as a warm drink, a sunny moment, or a kind word. How did noticing it make you feel?",
        resourceSuggestion: "Try starting a 'gratitude jar' - each day write one thing you're grateful for on a slip of paper and add it to the jar."
      },
      medium: {
        miraResponse: "It's great that you're mindful of gratitude. Like any practice, it can have its ebbs and flows. Building on your existing awareness can be very rewarding.",
        journalPrompt: "Journal Prompt: Think about someone you are grateful for. What qualities do you appreciate in them? Consider expressing this appreciation to them this week.",
        resourceSuggestion: "Consider a 'gratitude walk' – as you walk, consciously look for things in your environment to be thankful for."
      },
      high: {
        miraResponse: "That’s wonderful! It sounds like gratitude is already a significant and positive part of your life. This practice can be a deep source of joy and resilience.",
        journalPrompt: "Journal Prompt: How has your practice of gratitude shaped your perspective on challenges? How can you share or spread this sense of gratitude to others around you?",
        resourceSuggestion: "Explore 'gratitude meditation' or read about the psychological benefits of consistent gratitude practice to deepen your understanding."
      },
    },
  },
  // ... more topics for Wed, Thu, Fri, Sat, Sun
];

export const getTopicForDay = (dayIndex: number): DailyTopic | undefined => {
  // dayIndex: 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = dayMap[dayIndex];
  
  // Find a topic for the current day, or default to Monday if not found (or create more specific fallbacks)
  return sampleDailyTopics.find(topic => topic.dayOfWeek === currentDayName) || sampleDailyTopics.find(topic => topic.dayOfWeek === "Monday");
};

export const getDayOfWeek = (): string => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday",