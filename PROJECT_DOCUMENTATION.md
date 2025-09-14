# Neuro-AI Application: Complete Project Documentation

## 1. Project Overview & Purpose

**Neuro-AI** is a web application designed as a digital companion and support system for individuals experiencing cognitive decline, such as dementia, and for their caregivers. The application's primary goal is to enhance the patient's quality of life, promote cognitive engagement, and streamline care coordination.

**Core User Groups:**
- **Patients**: Individuals with cognitive impairment who use the app for daily scheduling, reminders, cognitive exercises, and accessing personal information safely.
- **Caregivers**: Family members or professional helpers who use the app to monitor the patient, manage their schedule and medications, and coordinate care.

**Key Themes:**
- **Simplicity & Accessibility**: The UI is designed to be clear, with large text options and intuitive navigation to minimize confusion for patients.
- **Cognitive Support**: Features like memory games, memory prompts, and a family tree help stimulate the patient's mind.
- **Care Coordination**: The app provides a shared platform for caregivers to manage the patient's daily life, ensuring consistency and safety.
- **AI Assistance**: Artificial Intelligence is integrated to provide gentle assistance, from answering simple questions to identifying medication.

---

## 2. Technology Stack

The project is built on a modern, robust, and scalable technology stack.

- **Frontend Framework**: **Next.js 15** with the App Router. This provides server-side rendering (SSR), static site generation (SSG), and a file-based routing system that is efficient and easy to manage.
- **UI Library**: **React 18** is used for building the user interface with functional components and hooks.
- **Language**: **TypeScript** is used for static typing, which improves code quality, readability, and developer productivity by catching errors early.
- **Styling**:
    - **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
    - **ShadCN/UI**: A collection of beautifully designed, accessible, and reusable UI components (like Cards, Buttons, and Dialogs) built on top of Tailwind CSS and Radix UI. The theme is customized in `src/app/globals.css`.
- **AI Integration**:
    - **Google's Genkit**: The framework used to create and manage all AI-powered "flows". It connects to Google's Gemini family of models.
    - **Gemini Models**: The underlying Large Language Models (LLMs) from Google that power features like the AI Companion, medicine identification, and game difficulty adjustment.
- **State Management**:
    - **React Hooks** (`useState`, `useEffect`): Used for local component state.
    - **Browser `localStorage`**: Acts as a simple, client-side "database" to persist user data and synchronize state between the Patient and Caregiver dashboards within the same browser. This is a key mechanism for the app's integration.
- **Icons**: **Lucide React**, a library of simply designed and consistent icons.

---

## 3. Project Architecture & Folder Structure

The project follows a standard Next.js App Router structure.

```
/
├── src/
│   ├── app/                # Main application routes (pages)
│   │   ├── (auth)/         # Group for auth-related pages (future use)
│   │   ├── caregiver/      # Caregiver dashboard route
│   │   ├── patient/        # Patient dashboard and feature routes
│   │   │   ├── games/      # Routes for all cognitive games
│   │   │   └── ...
│   │   ├── selection/      # Role selection page
│   │   ├── globals.css     # Global styles and Tailwind CSS theme variables
│   │   └── layout.tsx      # Root layout for the entire application
│   │   └── page.tsx        # The main landing/login page
│   │
│   ├── components/         # Reusable React components
│   │   ├── app/            # App-wide components (e.g., Header)
│   │   ├── caregiver/      # Components specific to the caregiver view
│   │   ├── patient/        # Components specific to the patient view
│   │   ├── shared/         # Components used by both patient and caregiver
│   │   └── ui/             # Core UI components from ShadCN (Button, Card, etc.)
│   │
│   ├── ai/                 # All Genkit AI-related code
│   │   ├── flows/          # Individual AI flows for specific tasks
│   │   └── genkit.ts       # Genkit global configuration
│   │
│   ├── hooks/              # Custom React hooks (e.g., `useToast`, `useMobile`)
│   │
│   └── lib/                # Utility functions and shared data
│       ├── data.ts         # Mock data for the application
│       └── utils.ts        # Helper functions (e.g., `cn` for classnames)
│
├── tailwind.config.ts      # Tailwind CSS configuration
└── next.config.ts          # Next.js configuration
```

---

## 4. Core Features & Implementation Details

### a. Authentication and Routing Flow

- **Login (`/`)**: The app starts with a mock login page. It doesn't perform real authentication. Upon successful "login," it sets a flag (`isLoggedIn`) in `localStorage` and redirects the user.
- **Role Selection (`/selection`)**: After login, the user chooses to proceed as a "Patient" or a "Caregiver".
- **Dashboards**: Based on the selection, the user is routed to `/patient` or `/caregiver`. These are the main hubs for each user type.

### b. Data Synchronization via `localStorage`

A key architectural decision is the use of `localStorage` to act as a shared data source. This allows changes made by one user (e.g., caregiver) to be immediately visible to the other (e.g., patient) if they are using the app in the same browser. This simulates a connected backend experience without requiring a database.

**Shared Data Keys**:
- `neuro-ai-daily-plan`: Stores the tasks for the day.
- `neuro-ai-medications`: Stores the medication schedule.
- `neuro-ai-family-tree`: Stores the family member data.
- `neuro-ai-memories`: Stores the memories (photos and stories).

### c. Patient Dashboard & Features (`/patient`)

This is the main interface for the patient. It's designed for clarity and ease of use.

- **PatientDashboard (`/src/components/patient/patient-dashboard.tsx`)**:
  - Displays a welcome message and profile picture.
  - Contains a "Tools to Help" section with links to all major features.
  - Integrates the **AI Companion**.
  - Shows the **Daily Schedule ("Your Day")** and **Medication Reminders**, which are editable.

- **Cognitive Games (`/patient/games/*`)**: A suite of games to stimulate the mind.
  - **Memory Match**: A classic card-matching game. It uses the `adjustGameDifficulty` AI flow to change the number of cards based on the player's performance (moves and time).
  - **Color Match, Word Scramble, Sequence Memory**: Other simple games with immediate feedback.

- **Medicine Identifier (`/patient/med-identifier`)**:
  - Allows the user to upload a photo of a medicine pack.
  - The photo (as a Base64 data URI) is sent to the `identifyMedicine` Genkit flow.
  - The AI analyzes the image and returns the medicine's name, usage, and other relevant details.

- **Family Tree & Memory Lane (`/patient/family-tree`, `/patient/memory-lane`)**:
  - These are visual tools for memory recall. They are fully editable by the patient.
  - The data is stored in `localStorage` and is shared with the caregiver view.

### d. Caregiver Dashboard & Features (`/caregiver`)

This dashboard provides a centralized view for managing patient care.

- **CaregiverDashboard (`/src/components/caregiver/caregiver-dashboard.tsx`)**:
  - Uses a sidebar for navigation between different management views: Dashboard, Care Coordination, and Patient Monitoring.
  - **Dashboard View**: Allows the caregiver to link to a patient account (mocked) and shows a quick overview.
  - **Patient Monitoring View**: A placeholder view for future features like alerts or location tracking.

- **Care Coordination View (`/src/components/caregiver/care-coordination-view.tsx`)**: This is the core of the caregiver experience. It uses a tabbed interface to manage:
  - **Daily Planner**: Add, edit, and delete tasks in the patient's schedule. Changes are saved to `localStorage` and are instantly visible on the patient's dashboard.
  - **Medications**: Manage the patient's medication list, with changes synced to the patient's view.
  - **Memory Lane**: Add and edit memories (photos and stories) for the patient.
  - **Family Tree**: View and manage the patient's family contacts.

### e. AI Integration with Genkit Flows

All backend AI logic is handled by Genkit flows defined in `src/ai/flows/`. These are server-side TypeScript functions that can be called from the frontend.

- **`ai-companion.ts`**:
  - **Flow**: `answerQuestionFlow`
  - **Purpose**: Takes a simple text question from the patient and uses the Gemini model to generate a gentle, conversational answer.
  - **Used In**: `AiCompanion` component on the patient dashboard.

- **`cognitive-game-difficulty-adjustment.ts`**:
  - **Flow**: `adjustGameDifficultyFlow`
  - **Purpose**: Analyzes the player's performance in a game (score, time, moves) and recommends a new difficulty level (`easy`, `medium`, `hard`) along with an encouraging message.
  - **Used In**: `CognitiveGame` (Memory Match) component.

- **`medicine-identification.ts`**:
  - **Flow**: `identifyMedicineFlow`
  - **Purpose**: Receives an image of a medicine pack (as a data URI) and uses a multi-modal Gemini model to identify the medicine name, usage, confidence level, and other details.
  - **Used In**: `MedicineIdentifier` component.

---
This document provides a foundational understanding of the Neuro-AI project. It is designed to be a living document that can be updated as the application evolves.
