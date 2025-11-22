# FOSSEE-winter-internship


Chemical Equipment Dashboard

A full-stack equipment analytics system featuring a React web dashboard, Django REST backend, and a PyQt5 + Matplotlib desktop application.
Supports CSV uploads, KPIs, visualizations, real-time analytics, PDF export, and dark-themed UI across all platforms.

📁 Project Structure
project-root/
│
├── backend/                # Django API backend
│   ├── manage.py
│   ├── api/
│   ├── requirements.txt
│   └── ...
│
├── frontend-web/           # React web dashboard
│   ├── src/
│   ├── public/
│   └── package.json
│
├── desktop-app/            # PyQt5 + Matplotlib desktop app
│   └── dashboard_app.py
│
└── README.md

🚀 Features

CSV upload & dataset management

KPI display (min/max/avg/etc.)

Bar, Histogram, Scatter, Line charts

Data tables + PDF export

Dark theme UI (Web & Desktop)

Modular frontend, backend, and desktop code

Backend API: Django REST Framework

🔧 Setup & Installation Guide

This section contains all commands you need to run the backend, frontend, and desktop applications.

1️⃣ Prerequisites (Install these first)

Install the required global tools:

Tool	Download Link
Python 3.8+	https://www.python.org/downloads/

pip	Comes with Python
Node.js (v16+) & npm	https://nodejs.org/

Git	https://git-scm.com/downloads

Verify installation:

python --version
pip --version
node --version
npm --version
git --version

2️⃣ Clone Repository
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name

3️⃣ Backend Setup (Django REST Framework)
a) Create & activate virtual environment (recommended)
Windows
python -m venv env
env\Scripts\activate

Mac / Linux
python3 -m venv env
source env/bin/activate

b) Install backend dependencies

Go to backend folder:

cd backend

Option 1 — Using requirements.txt
pip install -r requirements.txt

Option 2 — Manual install
pip install django djangorestframework pandas numpy

c) Run migrations & create superuser
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

d) Start backend server
python manage.py runserver


API Root: http://127.0.0.1:8000/api/

Datasets endpoint: http://127.0.0.1:8000/api/datasets/

Admin Panel: http://127.0.0.1:8000/admin/

4️⃣ Frontend Setup (React Web Dashboard)

Go to frontend folder:

cd ../frontend-web

a) Install Node dependencies
npm install

b) Start development server
npm start


App runs at: http://localhost:3000

c) Build React app for production
npm run build


Output is generated in:

frontend-web/build/

5️⃣ Desktop App Setup (PyQt5 + Matplotlib)

Go to desktop folder:

cd ../desktop-app

a) Install Python dependencies
pip install PyQt5 matplotlib pandas numpy requests

b) Run the desktop application
python dashboard_app.py

c) (Optional) Build executable using PyInstaller

Install PyInstaller:

pip install pyinstaller


Create a standalone EXE:

pyinstaller --onefile dashboard_app.py


Executable is created in:

desktop-app/dist/

📄 CSV Format Example

Make sure your CSV follows this structure:

Equipment Name,Type,Flowrate,Pressure,Temperature
Pump 1,Pump,200,5.5,30
Valve A,Valve,150,3.2,25
...


✔ No blank lines
✔ Use comma separators
✔ Header must be present

🛠 Troubleshooting
Backend fails to start

Ensure virtual environment is active

Reinstall libraries:

pip install -r requirements.txt

Frontend can't connect to backend

Check backend is running at port 8000

Update API base URL in React if necessary

Desktop app fails to render charts

Ensure Matplotlib & NumPy installed

CORS errors

Install and enable CORS:

pip install django-cors-headers


Add to Django settings.py:

INSTALLED_APPS += ["corsheaders"]
MIDDLEWARE.insert(0, "corsheaders.middleware.CorsMiddleware")
CORS_ALLOW_ALL_ORIGINS = True

📌 Common Commands Reference
Task	Command
Create virtual env	python -m venv env
Activate env	env\Scripts\activate / source env/bin/activate
Install backend deps	pip install -r requirements.txt
Install React deps	npm install
Run backend	python manage.py runserver
Run frontend	npm start
Run desktop app	python dashboard_app.py
Build React	npm run build
Build EXE	pyinstaller --onefile dashboard_app.py
