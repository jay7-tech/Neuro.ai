
# 🧠 Neuro-AI: A Compassionate Companion for Cognitive Care

<div align="center">

*A holistic digital ecosystem designed to support individuals with cognitive decline, empower their caregivers, and provide clinicians with actionable insights.*

</div>

---

### The Challenge: The Silent Epidemic of Cognitive Decline

Every three seconds, someone in the world develops dementia. With over **55 million people** living with dementia globally—a number projected to nearly triple by 2050—the impact on individuals, families, and healthcare systems is staggering.

-   **For Patients**: Cognitive decline often leads to a loss of independence, memory, and social connection, accompanied by feelings of confusion, anxiety, and loneliness.
-   **For Caregivers**: Family members and professionals face immense emotional, physical, and financial strain. They juggle complex schedules, medication management, and the heartbreak of watching a loved one change, often with little support.
-   **For Clinicians**: Doctors struggle to get a clear, day-to-day picture of a patient's condition, relying on infrequent appointments to track mood, cognition, and behavior.

Neuro-AI was born from a simple question: *How can technology serve as a compassionate bridge, connecting patients, caregivers, and doctors in a circle of support?*

---

### ✨ Core Features & Their Impact

Neuro-AI is more than just an app; it's a multi-faceted support system with tailored experiences for each user.

#### For Patients: Fostering Independence & Engagement
The patient dashboard is designed for ultimate simplicity, with large touch targets and intuitive navigation.
-   **AI Companion**: A gentle, patient AI assistant to answer simple questions ("What day is it?", "What is my son's name?"), reducing anxiety and providing companionship.
-   **Cognitive Games**: A suite of fun, adaptive games (Memory Match, Color Match) that stimulate the mind. The difficulty is adjusted by an AI to keep the user engaged without causing frustration.
-   **Daily Planner & Medication Reminders**: A clear, visual schedule for the day's activities and medication, empowering patients to follow their routine with confidence.
-   **Memory Lane & Family Tree**: A beautiful digital album of photos, stories, and family contacts to help patients stay connected to their most cherished memories and loved ones.
-   **Direct Caregiver Chat**: A simple, real-time chat interface to reduce feelings of isolation and make it easy to call for help.

#### For Caregivers: Streamlining Care & Reducing Burden
The caregiver dashboard is a centralized command center for managing every aspect of care.
-   **Care Coordination Hub**: A tabbed interface to manage the patient's daily plan, medications, music therapy playlist, memories, and family contacts. All changes are instantly synced to the patient's device.
-   **Patient Monitoring**: A real-time dashboard showing critical alerts (e.g., if the patient wanders), their location (mocked), and a 7-day mood chart to track emotional well-being.
-   **AI Caregiver Assistant**: Provides practical, empathetic, and actionable tips on topics like communication, safety, and self-care, offering support when it's needed most.

#### For Doctors: Enabling Data-Driven Clinical Insight
The doctor's dashboard provides a high-level, clinical view of patient progress.
-   **Patient Fleet Management**: Easily switch between patients to review their data.
-   **Clinical Notes**: Write, save, and review timestamped notes for a patient. These notes are automatically shared with the caregiver, closing the communication loop.
-   **Mood & Alert Monitoring**: View the patient's mood log chart and critical alerts to gain a deeper understanding of their condition between appointments.

---

### 🛠️ Technology Stack

This project is built on a modern, robust, and scalable technology stack chosen for its performance and developer experience.

-   **Framework**: **Next.js 15** (with App Router) for server-side rendering and optimized performance.
-   **UI Library**: **React 18** for building a dynamic and responsive user interface.
-   **Language**: **TypeScript** for static typing, ensuring code quality and maintainability.
-   **Styling**: **Tailwind CSS** for utility-first styling, combined with **ShadCN/UI** for a library of accessible, pre-built components.
-   **AI Integration**: **Google's Genkit** framework, powered by the **Gemini** family of models, for all generative AI features.
-   **Data Synchronization**: The browser's **`localStorage`** is cleverly used to simulate a real-time backend, allowing all three user roles (Patient, Caregiver, Doctor) to stay in sync when using the app in the same browser.

---

### 🚀 Getting Started

To get the project up and running on your local machine, follow these steps.

#### Prerequisites
-   Node.js (v18 or newer)
-   An NPM compatible package manager (e.g., npm, yarn, or pnpm)
-   A Google AI API Key

#### Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/neuro-ai.git
    cd neuro-ai
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**:
    This project uses Genkit, which requires a Google AI API key.
    -   Create a `.env` file in the root of the project.
    -   Add your API key to the `.env` file:
        ```
        GEMINI_API_KEY=your_api_key_here
        ```
    -   You can get a free key from [Google AI Studio](https://makersuite.google.com/app/apikey).

4.  **Run the development servers**:
    The application runs on two parallel processes: the Next.js frontend and the Genkit AI flows. You will need to run each command in a separate terminal.

    -   **Terminal 1: Run the Next.js App**:
        ```bash
        npm run dev
        ```
        This will start the frontend on [http://localhost:9002](http://localhost:9002).

    -   **Terminal 2: Run the Genkit Flows**:
        ```bash
        npm run genkit:watch
        ```
        This will start the Genkit development server, making the AI features available to the app.

You should now be able to access the application in your browser and explore all three dashboards!

---

For a complete and exhaustive breakdown of every feature, component, and data structure, please refer to the [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) file.
