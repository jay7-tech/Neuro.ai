# Neuro-AI Application: Complete Project Documentation

## 1. Project Overview & Purpose

**Neuro-AI** is a web application designed as a digital companion and support system for individuals experiencing cognitive decline, such as dementia, and for their caregivers and doctors. The application's primary goal is to enhance the patient's quality of life, promote cognitive engagement, and streamline care coordination between all parties.

**Core User Groups:**
- **Patients**: Individuals with cognitive impairment who use the app for daily scheduling, reminders, cognitive exercises, and accessing personal information safely.
- **Caregivers**: Family members or professional helpers who use the app to monitor the patient, manage their schedule and medications, and coordinate care.
- **Doctors**: Clinicians who use the app to monitor patient data, track mood, and manage clinical notes.

**Key Themes:**
- **Simplicity & Accessibility**: The UI is designed to be clear, with large text options and intuitive navigation to minimize confusion for patients.
- **Cognitive Support**: Features like memory games, memory prompts, and a family tree help stimulate the patient's mind.
- **Care Coordination**: The app provides a shared platform for caregivers to manage the patient's daily life and for doctors to monitor progress, ensuring consistency and safety.
- **AI Assistance**: Artificial Intelligence is integrated to provide gentle assistance, from answering simple questions to identifying medication and providing caregivers with helpful tips.

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
    - **Gemini Models**: The underlying Large Language Models (LLMs) from Google that power features like the AI Companion, medicine identification, game difficulty adjustment, and caregiver tips.
- **State Management & Data Persistence**:
    - **React Hooks** (`useState`, `useEffect`): Used for local component state.
    - **Browser `localStorage`**: Acts as a simple, client-side "database" to persist user data and synchronize state between the Patient, Caregiver, and Doctor dashboards within the same browser. This is a key mechanism for the app's integration.
- **Icons**: **Lucide React**, a library of simply designed and consistent icons.

---

## 3. Project Architecture & Folder Structure

The project follows a standard Next.js App Router structure.

```
/
├── src/
│   ├── app/                # Main application routes (pages)
│   │   ├── caregiver/      # Caregiver dashboard route
│   │   ├── doctor/         # Doctor dashboard route
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
│   │   ├── doctor/         # Components specific to the doctor view
│   │   ├── patient/        # Components specific to the patient view
│   │   ├── shared/         # Components used by multiple roles
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
│       ├── placeholder-images.json # Centralized source for all image URLs
│       └── utils.ts        # Helper functions (e.g., `cn` for classnames)
│
├── tailwind.config.ts      # Tailwind CSS configuration
└── next.config.ts          # Next.js configuration
```

---

## 4. Core Features & Implementation Details

### a. Authentication and Routing Flow

- **Login (`/`)**: The app starts with a mock login page. It doesn't perform real authentication. Upon successful "login," it sets a flag (`isLoggedIn`) in `localStorage` and redirects the user.
- **Role Selection (`/selection`)**: After login, the user chooses to proceed as a "Patient," "Caregiver," or "Doctor".
- **Dashboards**: Based on the selection, the user is routed to `/patient`, `/caregiver`, or `/doctor`. These are the main hubs for each user type.

### b. Data Synchronization via `localStorage`

A key architectural decision is the use of `localStorage` to act as a shared data source. This allows changes made by one user (e.g., caregiver) to be immediately visible to others (e.g., patient, doctor) if they are using the app in the same browser. This simulates a connected backend experience without requiring a database.

**Shared Data Keys (Pattern: `neuro-ai-[patientId]-[dataType]`)**:
- `neuro-ai-[patientId]-daily-plan`: Stores the tasks for the day.
- `neuro-ai-[patientId]-medications`: Stores the medication schedule.
- `neuro-ai-[patientId]-family-tree`: Stores the family member data.
- `neuro-ai-[patientId]-memories`: Stores the memories (photos and stories).
- `neuro-ai-[patientId]-music`: Stores the custom music/sound list.
- `neuro-ai-[patientId]-chat`: Stores the chat history between the patient and caregiver.
- `neuro-ai-[patientId]-mood-log`: Stores the patient's daily mood entries.
- `neuro-ai-[patientId]-clinical-notes`: Stores notes added by the doctor, visible to the caregiver.

### c. Patient Dashboard & Features (`/patient`)

This is the main interface for the patient, designed for clarity and ease of use.

- **PatientDashboard (`/src/components/patient/patient-dashboard.tsx`)**:
  - Displays a welcome message and the patient's profile picture.
  - Contains a "Tools to Help" section with links to all major features.
  - Integrates the **AI Companion**, a **Caregiver Chat**, and a **Mood Tracker**.
  - Shows the **Daily Schedule ("Your Day")** and **Medication Reminders**, which are fully editable by the patient.

### d. Caregiver Dashboard & Features (`/caregiver`)

This dashboard provides a centralized view for managing patient care.

- **CaregiverDashboard (`/src/components/caregiver/caregiver-dashboard.tsx`)**:
  - Uses a collapsible sidebar for navigation between different management views.
  - **Dashboard View**: Allows the caregiver to link to a patient account (mocked) and shows a quick overview and AI-powered tips.
  - **Profile View**: Manages a unified view of the patient, caregiver, and doctor, and provides a read-only view of shared clinical notes.
  - **Patient Monitoring View**: Displays alerts, the patient's location (mocked), and a chart of their mood log.
  - **Care Coordination View**: The core management hub, using a tabbed interface to manage:
    - Chat with Patient
    - Daily Planner
    - Medications
    - Music Therapy playlist
    - Memory Lane
    - Family Tree

### e. Doctor Dashboard & Features (`/doctor`)

This dashboard is for clinical oversight.

- **DoctorDashboard (`/src/components/doctor/doctor-dashboard.tsx`)**:
    - Manages a list of patients and an "active patient" selection.
    - **Patients View**: The landing page, allowing the doctor to add new patients and view high-level data (alerts, mood chart) for the active patient.
    - **Clinical Notes View**: Allows the doctor to write, save, and review timestamped clinical notes for the active patient. These notes are then visible to the caregiver.

### f. AI Integration with Genkit Flows

All backend AI logic is handled by Genkit flows defined in `src/ai/flows/`.

- **`ai-companion.ts`**: (`answerQuestionFlow`) Powers the patient's AI companion, providing gentle answers to simple questions.
- **`cognitive-game-difficulty-adjustment.ts`**: (`adjustGameDifficultyFlow`) Analyzes game performance (moves, time) to recommend a new difficulty level, keeping the game engaging but not frustrating.
- **`medicine-identification.ts`**: (`identifyMedicineFlow`) Uses a multi-modal model to identify medicine from an uploaded photo of a tablet pack.
- **`caregiver-tips.ts`**: (`getCaregiverTipFlow`) Provides caregivers with random, empathetic, and actionable tips on various topics.

---

## 5. UI and Feature Guide (Page by Page)

This section provides a detailed breakdown of every page and major component.

### a. Login Page (`/`)
- **File**: `src/app/page.tsx`
- **Purpose**: A mock sign-in screen.
- **Functionality**: A simple form that checks for non-empty fields, sets an `isLoggedIn` flag in `localStorage`, and redirects to `/selection`.

### b. Role Selection Page (`/selection`)
- **File**: `src/app/selection/page.tsx`
- **Purpose**: Allows the user to choose their role (Patient, Caregiver, or Doctor).
- **Functionality**: Three large, clickable cards that navigate to the respective dashboards (`/patient`, `/caregiver`, `/doctor`).

### c. Patient Dashboard (`/patient`)
- **File**: `src/components/patient/patient-dashboard.tsx`
- **Key Components**:
    - **Profile Header**: Displays patient's name and photo. Links to the full profile page (`/patient/profile`).
    - **Tools to Help**: A grid of large, clickable cards linking to feature pages (Cognitive Games, Med Identifier, etc.).
    - **Call for Help Button**: A large, prominent button that initiates a phone call to the primary caregiver's number (`tel:<phone_number>`).
    - **Caregiver Chat**: (`/src/components/patient/caregiver-chat.tsx`) A real-time chat interface that reads from and writes to `localStorage`, allowing direct communication with the caregiver.
    - **Mood Tracker**: (`/src/components/patient/mood-tracker.tsx`) Allows the patient to log their mood once per day (Happy, Okay, Sad). This data is stored in `localStorage` and visualized on the caregiver and doctor dashboards.
    - **AI Companion**: (`/src/components/patient/ai-companion.tsx`) A chat interface that sends questions to the `answerQuestion` AI flow.
    - **Editable Daily Plan & Medications**: These lists are loaded from `localStorage`. An "Edit" button toggles an editing mode where the patient can add, modify, or delete items. Changes are saved back to `localStorage`.

### d. Caregiver Dashboard (`/caregiver`)
- **File**: `src/components/caregiver/caregiver-dashboard.tsx`
- **Key Components**:
    - **Sidebar Navigation**: A collapsible menu to switch between views. It shows the currently linked patient.
    - **Dashboard View** (`.../dashboard-view.tsx`):
        - **Patient Linking**: An input for a patient ID. On linking, it stores the patient's info in `localStorage` and "unlocks" the other features.
        - **AI Caregiver Assistant**: Fetches and displays a helpful tip from the `getCaregiverTip` AI flow.
    - **Care Coordination View** (`.../care-coordination-view.tsx`):
        - **Functionality**: A tabbed interface to manage all shared patient data. All changes are saved to the corresponding `localStorage` key, ensuring instant sync with the patient's view.
        - **Tabs**: Chat, Daily Planner, Medications, Music Therapy, Memory Lane, Family Tree. Each provides full CRUD (Create, Read, Update, Delete) functionality.
    - **Patient Monitoring View** (`.../patient-monitoring-view.tsx`):
        - **Functionality**: Provides a read-only view of patient status.
        - **UI**: Displays alerts, a mock location map, and the `MoodChart` component which visualizes data from the patient's mood log.
    - **Profile View** (`.../profile-view.tsx`):
        - **Functionality**: A unified "Care Team" view.
        - **UI**: Shows cards for the Patient, Caregiver (editable), and Doctor. It also includes a read-only list of clinical notes shared by the doctor.

### e. Doctor Dashboard (`/doctor`)
- **File**: `src/components/doctor/doctor-dashboard.tsx`
- **Key Components**:
    - **Sidebar & Patient Selection**: A dropdown in the sidebar allows the doctor to select an "active patient" from their list. This selection is persisted in `localStorage`.
    - **Patients View** (`.../patients-view.tsx`):
        - **Functionality**: Allows adding new patients via their ID. For the active patient, it shows high-level data like critical alerts (mocked) and the `MoodChart`.
    - **Clinical Notes View** (`.../clinical-notes-view.tsx`):
        - **Functionality**: For the active patient, the doctor can write new clinical notes and view a history of all previous notes.
        - **Data Flow**: Notes are saved to `localStorage` (`neuro-ai-[patientId]-clinical-notes`). These notes are then displayed in a read-only format on the caregiver's "Profile" view.

### f. Shared & Feature-Specific Components

- **Memory Lane & Family Tree** (`/src/components/shared/...`):
    - **Functionality**: These are robust, self-contained components used by both Patient and Caregiver. They manage their own state (loaded from `localStorage`), including an "editing" mode that shows a detailed form for adding, updating, or deleting items. They handle image uploads (as Base64 data URIs) and save all changes back to `localStorage`.
- **Cognitive Games** (`/src/app/patient/games/...`):
    - **Memory Match**: (`.../cognitive-game.tsx`) A card-matching game that calls the `adjustGameDifficulty` AI flow upon completion to recommend a new difficulty for the next round.
    - **Other Games**: Color Match, Word Scramble, and Sequence Memory are simpler games providing immediate feedback without AI integration.
- **Medicine Identifier** (`/src/components/patient/medicine-identifier.tsx`):
    - **Functionality**: Allows a user to upload a photo of a medicine pack. The image is converted to a Base64 data URI and sent to the `identifyMedicine` AI flow. The results (name, confidence, usage, etc.) are displayed in an alert box.
- **Mood Chart** (`/src/components/shared/mood-chart.tsx`):
    - **Functionality**: A reusable chart component that takes a `patientId`, reads the corresponding mood log from `localStorage`, and renders a 7-day bar chart of the patient's mood.

---
This document provides a foundational and complete understanding of the Neuro-AI project. It is designed to be the single source of truth for the application's architecture and functionality.
