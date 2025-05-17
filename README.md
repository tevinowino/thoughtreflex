
# ThoughtReflex - Your AI-Powered Therapy Journal

ThoughtReflex is a web application designed to be your personal AI-powered therapist and emotional journal. It provides a safe, intelligent, and reflective space for users to explore their thoughts and emotions, fostering self-awareness and promoting mental well-being.

**Reflect deeply. Heal gently.**

## Key Features

*   **AI-Powered Journaling**: Engage in empathetic, chat-based conversations with Mira, your AI companion, designed to help you explore and understand your feelings.
*   **Adaptive Therapist Modes**: Tailor Mira's interaction style to your current needs by choosing between:
    *   **Therapist Mode**: For deep, reflective, and slow-paced conversations.
    *   **Coach Mode**: For motivational, structured guidance, helping you work towards your goals.
    *   **Friend Mode**: For casual, warm, and supportive conversations.
*   **Contextual AI Conversations**: Mira remembers the flow of your current journaling session, providing relevant follow-ups and maintaining context.
*   **Traditional Notebook**: A private, non-AI space for your unfiltered thoughts, free-writing, or quick notes.
*   **Goal Setting & Tracking**: Define, manage, and track your personal healing and growth milestones. Mira can reference your active goals in "Coach" mode.
*   **Dynamic Weekly AI Recaps**: At the end of each week, generate a personalized summary of your journal entries. Mira identifies emotional trends, victories, and struggles from your actual writings.
*   **Personalized Insights Page**: Uncover deeper patterns in your emotional landscape with dynamically generated insights:
    *   **Emotion Trends**: Visualizes sentiment (positive, negative, neutral) from your recent weekly recaps in a bar chart.
    *   **Recurring Themes**: Identifies common topics and their frequency from your journal entries over the last 30 days.
    *   **Key Suggestions**: Offers personalized observations and actionable suggestions based on your recent journaling.
*   **Journaling Streaks**: Stay motivated with daily journaling streaks! The app tracks your current and longest streaks for consistent reflection.
*   **Secure User Authentication**:
    *   Sign up and log in securely using Email/Password.
    *   Option to sign in with Google OAuth for quick access.
*   **Comprehensive User Settings**:
    *   Update your display name.
    *   Set your default AI therapist mode.
    *   Change your account password.
    *   Export all your personal data (profile, goals, journals, notebook entries) in JSON format.
*   **Theme Customization**: Easily switch between light and dark modes for a comfortable viewing experience.
*   **Responsive Design**: Enjoy a seamless experience across desktop, tablet, and mobile devices.

## Technology Stack

*   **Frontend**:
    *   Next.js (App Router)
    *   React
    *   TypeScript
*   **Styling**:
    *   Tailwind CSS
    *   ShadCN UI Components
*   **Backend & Database**:
    *   Firebase (Authentication, Firestore for data persistence)
*   **Artificial Intelligence**:
    *   Genkit (by Google)
    *   Google AI (Gemini models)
*   **UI Components & Icons**:
    *   Lucide Icons
    *   Recharts (for charts on the Insights page)
    *   Radix UI (underlying primitives for ShadCN components)
*   **Form Handling**:
    *   React Hook Form
    *   Zod (for schema validation)

## Getting Started

Follow these instructions to get a local copy of ThoughtReflex up and running for development and testing.

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm, yarn, or pnpm

### Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://your-repository-url/thoughtreflex.git
    cd thoughtreflex
    ```

2.  **Set up Firebase**:
    *   Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    *   In your Firebase project, enable the following services:
        *   **Authentication**: Enable "Email/Password" and "Google" sign-in methods. Add `localhost` to the list of authorized domains for development.
        *   **Firestore Database**: Create a Firestore database in Native mode.
    *   Go to **Project settings** > **General**. Under "Your apps", click the Web icon (`</>`) to add a web app.
    *   Register your app and copy the Firebase configuration object.

3.  **Environment Variables**:
    *   Create a `.env` file in the root of your project by copying the example:
        ```bash
        cp .env.example .env
        ```
    *   Open the `.env` file and fill in your Firebase project's configuration details. These should be prefixed with `NEXT_PUBLIC_`:
        ```env
        NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
        NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
        NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID" # Optional for Analytics
        ```
    *   **Important**: You will also need to set up Google Cloud credentials for Genkit if you haven't already. Ensure your Google Cloud project (which is linked to your Firebase project) has the "Vertex AI API" (or "AI Platform Training & Prediction API" for older projects) enabled. Follow Genkit documentation for authenticating your local environment (e.g., using `gcloud auth application-default login`).

4.  **Install Dependencies**:
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

5.  **Run the Development Servers**:
    You'll need to run two separate development servers: one for the Next.js application and one for Genkit (which handles the AI flows).

    *   **Next.js App**:
        ```bash
        npm run dev
        ```
        This will typically start the app on `http://localhost:9002` (or another port if 9002 is busy).

    *   **Genkit AI Flows** (in a new terminal window/tab):
        ```bash
        npm run genkit:dev
        # or for watching changes:
        # npm run genkit:watch
        ```
        This will start the Genkit development server, usually on `http://localhost:3400`. The Next.js app will make requests to this server for AI functionalities.

6.  Open your browser and navigate to `http://localhost:9002` (or your Next.js app's port).

## Firestore Security Rules

For production, and even for robust development, you **must** set up Firestore security rules to protect user data. A basic example is provided below. Apply these in the Firebase console under Firestore Database > Rules.

```json
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null; // Allow user doc creation on signup

      match /goals/{goalId} {
        allow read, write, delete: if request.auth != null && request.auth.uid == userId;
      }
      match /journalSessions/{sessionId} {
        allow read, write, delete: if request.auth != null && request.auth.uid == userId;
        match /messages/{messageId} {
          allow read, write, delete: if request.auth != null && request.auth.uid == userId;
        }
      }
      match /weeklyRecaps/{recapId} {
        allow read, write, delete: if request.auth != null && request.auth.uid == userId;
      }
      match /notebookEntries/{entryId} {
        allow read, write, delete: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Available Scripts

In the project directory, you can run:

*   `npm run dev`: Starts the Next.js development server.
*   `npm run genkit:dev`: Starts the Genkit development server.
*   `npm run genkit:watch`: Starts the Genkit development server with file watching.
*   `npm run build`: Builds the app for production.
*   `npm run start`: Starts a Next.js production server (after building).
*   `npm run lint`: Lints the project files.
*   `npm run typecheck`: Runs TypeScript type checking.

## Folder Structure (Simplified)

```
/
├── public/                 # Static assets
├── src/
│   ├── ai/                 # Genkit AI flows and configuration
│   │   ├── flows/          # Individual AI flow implementations
│   │   ├── dev.ts          # Genkit development server entry point
│   │   └── genkit.ts       # Genkit global AI instance
│   ├── app/                # Next.js App Router pages and layouts
│   │   ├── (app)/          # Authenticated app routes (dashboard, journal, etc.)
│   │   ├── (auth)/         # Authentication routes (login, signup)
│   │   ├── about/
│   │   ├── careers/
│   │   ├── contact/
│   │   ├── privacy/
│   │   ├── terms/
│   │   ├── globals.css
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Landing page
│   ├── components/
│   │   ├── app/            # Components specific to the authenticated app
│   │   ├── auth/           # Authentication-related components
│   │   ├── landing/        # Components for the landing page
│   │   ├── ui/             # ShadCN UI components (Button, Card, etc.)
│   │   └── mode-toggle.tsx # Dark/Light mode toggle
│   │   └── theme-provider.tsx
│   ├── contexts/
│   │   └── auth-context.tsx # Authentication context and hooks
│   ├── hooks/
│   │   ├── use-mobile.tsx  # Hook for detecting mobile viewport
│   │   └── use-toast.ts    # Toast notification hook
│   ├── lib/
│   │   ├── firebase.ts     # Firebase initialization
│   │   └── utils.ts        # Utility functions (e.g., cn for Tailwind)
├── .env                    # Environment variables (Firebase keys, etc.) - Gitignored
├── .env.example            # Example environment variables file
├── components.json         # ShadCN UI configuration
├── next.config.ts          # Next.js configuration
├── package.json
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Future Enhancements

*   **Deeper AI Memory**: Implement long-term memory for Mira across sessions.
*   **Advanced Insights**: More sophisticated data analysis and visualizations on the Insights page.
*   **Notifications**: Reminders for journaling or goal check-ins.
*   **Voice Input**: Allow users to speak their journal entries.
*   **Mood Tracking**: Dedicated mood tracking features.
*   **More AI Tools**: Potentially add AI tools for specific exercises (e.g., CBT, mindfulness).

---

Thank you for exploring ThoughtReflex! We hope it provides a valuable tool for your mental wellness journey.
