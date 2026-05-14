# Recomended workflow (Cloning process). from idea to the full app:
## Idea selection: 
go to one of the following sites looking for apps to clone:
- AppSumo
- product hunt
- CodeCanyon
## Go to ChaptGpt, provide details for the selelcted product, asking for gap analysis using the following prompt:
- URL
- P1: explain the product *<selected product name, e.g: WeFix>* and highlight the pros & cons
- P2: I would like to develop same application please advice a new brand niche name for the new application
- P3: I have choosed the new name as *<new product name>* please design application logo
- P4: generate the PRD for the new product using the below Tech stack and provide: 1- React19  2- Typescript 3- TailwindCss4 5- Zod as validation 6- Zustand as schema provider  7-TanStack Query/Router/forms 9- JWT as Authentication 10- axios for calling External API 
### Note: 
1- the app will use during testing json-server with db.json. Make sure to generate db.json as per the created functiolaities and seed it with sample data
2- Be sure to generate sepearte pages for: Login, logout, signup, change password with JWT authentication 
3- API calling should also be JWT-secured
4- Be sure App.tsx will be directed to display home page for login

## Use the below prompt on arena.ai using model "Qwen3.6 plus" to generate the source code as zip file
"As a senior software engineer, please generate full source code for all functionalities listed in the following PRD <past the genrated PRD>"

## take the code and use AntiGravity to start building/testing/fixing the cloned product 
## start adding enhancedments as seperate prompts to the new product

# Full Prompt
Here is the full prompt you can copy/paste and use with Gemini/Claude/Qwen or any LLM:

```text
I am planning to clone an existing application to understand its architecture, features, and codebase structure. My goal is to learn how to build such an application myself and eventually enhance it with additional features.

Application to clone: <PASTE APPLICATION URL OR DESCRIPTION HERE>

Please perform the following analysis and generate all the deliverables requested:

### Phase 1: Gap Analysis and Concept Refinement
1. Analyze the application on <PASTE URL>. Identify and list:
   - Its main features and functionalities
   - Strengths and weaknesses (pros & cons)
   - Target audience
2. Based on the analysis, propose a new niche for a similar application to avoid direct competition and add unique value. Suggest a new brand/niche name (e.g., if the original is "WeFix", suggest something like "SwiftServe" or "QuickFixPro" with a specific focus like "Local Home Services").
3. Design a modern logo for this new application in SVG format (or as ASCII art if not able to generate images, but preferably vector).

### Phase 2: Product Requirements Document (PRD)
Generate a detailed PRD for the new application with the following specifications:
- **Title**: <New Product Name> – On-Demand Service Marketplace
- **Frontend**: React 19 + TypeScript
- **Styling**: TailwindCSS v4
- **State Management**: Zustand for global state (auth, UI, filters)
- **Data Fetching**: TanStack Query
- **Routing**: TanStack Router
- **Form Handling**: TanStack Form
- **Validation**: Zod (shared schemas between frontend and backend)
- **Authentication**: JWT-based authentication (tokens in memory/localStorage for now)
- **API Client**: Axios (with interceptors for JWT and error handling)
- **Backend**: For initial development, use json-server with a detailed db.json file containing seeded sample data for all features. This should simulate a REST API.
- **Core Features**:
  1. User Authentication: Login, logout, registration, password change (JWT-based)
  2. Service Browsing: List services with filters (category, location, price)
  3. Service Details: View provider details, pricing, reviews
  4. Booking System: Request, accept, reject, and track bookings
  5. User Roles: Customer, Service Provider, Admin
  6. Provider Dashboard: Manage services, view bookings and earnings
  7. Admin Dashboard: Manage users, providers, categories, services, bookings, and reviews
- **File Structure**: Suggest a clear, scalable folder structure (e.g., src/app, src/features, src/components, etc.)
- **Non-Functional Requirements**: Include sections on performance, scalability, and maintainability.

### Phase 3: Code Generation
Using the generated PRD, create the full source code for the frontend application in a single zip file. The code should include:
1. All pages (home, login, register, services, bookings, provider dashboard, admin dashboard, etc.)
2. Complete implementation of all features listed in the PRD
3. Functional JWT authentication system
4. Axios-based API calls to the json-server backend
5. Responsive UI using TailwindCSS
6. Proper TypeScript typings throughout
7. Sample data in db.json that can be used with json-server for immediate testing
8. A clean and organized folder structure as specified in the PRD

Please ensure the code is:
- Well-commented and easy to understand
- Modular and follows React best practices
- Immediately runnable with `npm install` and `json-server`
- The json-server API endpoints should match the structure used by the frontend axios calls

Generate the complete response with:
1. The gap analysis and new product concept
2. The full PRD document
3. A downloadable zip file of the complete source code

Thank you!
```