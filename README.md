# Neuro-AI: A Cognitive Support Companion

Neuro-AI is a web application designed as a digital companion and support system for individuals with cognitive decline, their caregivers, and their doctors. It aims to enhance quality of life, promote cognitive engagement, and streamline care coordination.

## Core Features

- **Multi-User Dashboards**: Separate, tailored interfaces for Patients, Caregivers, and Doctors.
- **Cognitive Engagement**: Includes interactive games (Memory Match, Color Match, etc.) and a "Memory Lane" feature to help stimulate the patient's mind.
- **Care Coordination**: Tools for caregivers to manage daily plans, medication schedules, and communicate with the patient via a built-in chat.
- **AI-Powered Assistance**:
    - An **AI Companion** to answer patient questions.
    - **Medicine Identifier** using a device's camera.
    - **AI-powered caregiver tips** and game difficulty adjustments.
- **Patient Monitoring**: A dashboard for caregivers and doctors to track patient mood logs, location (mocked), and other alerts.
- **Clinical Notes**: A private section for doctors to log notes that are then shared with the caregiver.

---

## Technology Stack

This project is built on a modern and scalable tech stack:

- **Framework**: [Next.js 15](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React 18](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN/UI](https://ui.shadcn.com/) for a utility-first component library.
- **AI Integration**: [Google's Genkit](https://firebase.google.com/docs/genkit) with Gemini models.
- **Data Persistence**: Uses the browser's `localStorage` to simulate a connected backend and synchronize data across the different user views (Patient, Caregiver, Doctor) within the same browser session.

---

## Getting Started

To get the project up and running on your local machine, follow these steps.

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn

### Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**:
    This project uses Genkit, which requires a Google AI API key.
    - Create a `.env` file in the root of the project.
    - Add your API key to the `.env` file:
      ```
      GEMINI_API_KEY=your_api_key_here
      ```

4.  **Run the development server**:
    The application runs on two parallel processes: the Next.js frontend and the Genkit AI flows.

    - **Terminal 1: Run the Next.js App**:
      ```bash
      npm run dev
      ```
      This will start the frontend on [http://localhost:9002](http://localhost:9002).

    - **Terminal 2: Run the Genkit Flows**:
      ```bash
      npm run genkit:watch
      ```
      This will start the Genkit development server, allowing the AI features to function.

You should now be able to access the application in your browser.

---

## Project Structure

The project follows a standard Next.js App Router structure, organizing files by feature and domain.

```
/src
├── app/                # Next.js routes, layouts, and pages
│   ├── caregiver/      # Caregiver dashboard route
│   ├── doctor/         # Doctor dashboard route
│   ├── patient/        # Patient-facing routes (dashboard, games, etc.)
│   ├── selection/      # Role selection page
│   ├── globals.css     # Global styles and Tailwind CSS theme
│   └── page.tsx        # The main landing (login) page
│
├── components/         # Reusable React components
│   ├── app/            # App-wide components (e.g., Header)
│   ├── caregiver/      # Components specific to the caregiver view
│   ├── doctor/         # Components specific to the doctor view
│   ├── patient/        # Components specific to the patient view
│   ├── shared/         # Components used across multiple roles
│   └── ui/             # Core UI components from ShadCN
│
├── ai/                 # All Genkit AI-related code
│   ├── flows/          # Genkit flows for specific AI tasks
│   └── genkit.ts       # Global Genkit configuration
│
├── hooks/              # Custom React hooks
│
└── lib/                # Shared utilities, data, and type definitions
    ├── data.ts         # Mock data for the application
    └── placeholder-images.json # Centralized URLs for all images
```

---

For a complete and exhaustive breakdown of every feature, component, and data structure, please refer to the [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) file.
