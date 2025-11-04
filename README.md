# Ritvik Indupuri's Personal Portfolio Website

**[View Live Demo](https://ritvik-indupuri-portfolio.lovable.app/)**

---

## About This Project

Welcome to my personal project portfolio! This application showcases my skills and the projects I've built. It's designed to be a clean, fast, and responsive platform where you can learn more about my work in Cloud Security , cybersecurity, and Artificial Intelligence (AI).

## Key Features

- **Personal Portfolio Website**: Showcases your projects, experience, education, and skills.
- **AI Chatbot Integration**: Allows visitors to ask natural-language questions about your skills and projects.
- **Dynamic Skills and Projects Tracking**: Automatically updates total skill counts when new entries are added.
- **Documentation System**: Technical documentation editor and viewer directly built into the site.
- **Project Linking**: Owners can add projects and link to their GitHub repositories.

## Backend and Database Architecture

- **Supabase Backend (PostgreSQL)**: Chosen for its robust security controls and built-in authentication system.
- **Database Functions and Policies**: `has_role()` SQL function checks user privileges securely on the server side.
- **Audit and Data Integrity**: `update_updated_at_column()` function automatically timestamps edits.
- **Email Sending**: All emails are sent to a designated secure email address.

## Authentication and Access Control

- **Supabase Auth**: Implements secure JWT-based authentication tokens.
- **Session Management**: Synchronizes session state with the `AccessDialog` component.
- **Owner vs. Guest Access**: Guests can view public data only, while the owner can add or edit content after verification.

## Security Controls and Best Practices

- **Cross-Site Scripting (XSS) Prevention**: `DOMPurify` sanitizes all chatbot and user-facing HTML content.
- **Input Validation and Sanitization**: Zod schema validation enforces safe, structured input for all forms.
- **Rate Limiting**: The chatbot and contact form have rate limits to prevent abuse.
- **Content Security Policy (CSP) and HTTP Headers**: The application implements a strict CSP and other security headers to prevent common web vulnerabilities.
- **Cross-Origin Resource Sharing (CORS)**: Configured to only allow requests from verified domains.
- **Leaked Password Protection**: Supabase’s built-in feature checks credentials against known breach databases.
- **Password Complexity Enforcement**: Requires strong passwords for the owner account.
- **Prompt Injection Defense**: Detects and logs attempts to manipulate chatbot instructions.
- **Local Development Hardening**: The development server is bound to `127.0.0.1` for local use only.
- **Database Encryption and Secret Storage**: All credentials and service keys are stored in Supabase’s encrypted vault.

## Tech Stack

This project is built with a modern, full-stack tech stack:

* **Frontend:**
    * React
    * Vite
    * TypeScript
* **Styling:**
    * Tailwind CSS
    * shadcn-ui
* **Backend & Database:**
    * Supabase

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Make sure you have Node.js (version 18.x or higher recommended) and npm installed on your machine.

### Installation & Running Locally

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/your-repo-name.git
    ```

2.  **Navigate to the project directory:**
    ```sh
    cd your-repo-name
    ```

3.  **Install dependencies:**
    ```sh
    npm install
    ```

4.  **Set up environment variables:**
    This project requires environment variables to connect to Supabase. Create a file named `.env.local` in the root of the project and add the following:

    ```.env
    VITE_SUPABASE_URL="httpsYOUR_SUPABASE_PROJECT_URL"
    VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
    ```
    *You can find these keys in your Supabase project's API settings.*

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open http://localhost:5173 (or the port specified in your terminal) to view it in your browser.

## Deployment

This application is ready to be deployed! The easiest way to deploy a Vite + React application is by using a static hosting provider like:

* Vercel
* Netlify
* GitHub Pages

These platforms will typically detect that you are using Vite, build the project, and deploy it from your main branch automatically. Just connect your GitHub repository and follow their setup instructions.
