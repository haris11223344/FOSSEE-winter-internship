import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import requests

from PyQt5.QtCore import Qt
from PyQt5.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout,
    QFileDialog, QPushButton, QLabel, QTableWidget, QTableWidgetItem,
    QStackedLayout, QFrame
)
from PyQt5.QtGui import QColor, QPalette
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas

# THEME: Only dark, matching your React dashboard
themes = {
    "dark": {
        "bg": "#161f2a",
        "panel": "#222e3c",
        "text": "#e6eaf1",
        "header": "#3fc1c9",
        "kpi_gradients": ["#174d56", "#352322", "#1b5b53", "#321e40"],
        "border": "#3fc1c9",
        "btn_bg": "#212d43",
        "btn_text": "#3fc1c9",
        "axis_text": "#bdd8ed"  # Light blue for chart numbers
    }
}

def upload_csv_to_backend(filepath, api_url="http://127.0.0.1:8000/api/datasets/"):
    print("Uploading to backend:", filepath)
    try:
        with open(filepath, 'rb') as f:
            files = {'file': (filepath, f)}
            data = {'name': filepath.split('/')[-1]}
            response = requests.post(api_url, data=data, files=files)
        if response.ok:
            print("Upload succeeded:", response.json())
            return True
        else:
            print("Upload failed:", response.text)
            return False
    except Exception as e:
        print("Backend upload error:", e)
        return False

class KpiCard(QFrame):
    def __init__(self, title, value, hint, color, theme):
        super().__init__()
        self.setStyleSheet(f"""
            QFrame {{
                background: {color};
                border: 2.7px solid {theme['border']};
                border-radius: 16px;
                color: {theme['text']};
                min-width: 160px;
                max-width: 240px;
                padding: 16px 16px 12px 16px;
            }}
        """)
        layout = QVBoxLayout()
        label = QLabel(title)
        label.setStyleSheet("font-size: 14px; opacity: 0.8; color: #e6eaf1;")
        layout.addWidget(label)
        value_label = QLabel(str(value))
        value_label.setStyleSheet("font-size: 26px; font-weight:700; letter-spacing:0.6px; margin-top:6px; color: #e6eaf1;")
        layout.addWidget(value_label)
        hint_label = QLabel(hint)
        hint_label.setStyleSheet("font-size:12px; opacity: 0.92; margin-top:6px; color: #e6eaf1;")
        layout.addWidget(hint_label)
        self.setLayout(layout)

class Dashboard(QWidget):
    def __init__(self):
        super().__init__()
        self.theme_mode = "dark"
        self.setWindowTitle("Chemical Equipment Dashboard")
        self.resize(1280, 860)
        self.headers = []
        self.data = pd.DataFrame()
        self.setup_ui()

    def setup_ui(self):
        self.main_layout = QVBoxLayout()
        self.setStyleSheet(f"background-color: {themes[self.theme_mode]['bg']}; color: {themes[self.theme_mode]['text']};")
        pal = QPalette()
        pal.setColor(QPalette.Window, QColor(themes[self.theme_mode]['bg']))
        self.setPalette(pal)

        # Header (matches button/kpi color)
        header_layout = QHBoxLayout()
        self.title_lbl = QLabel("Chemical Equipment Dashboard")
        self.title_lbl.setStyleSheet(
            f"font-size:48px; font-weight:900; letter-spacing:1px; color:{themes[self.theme_mode]['header']};"
        )
        header_layout.addWidget(self.title_lbl)
        header_layout.addStretch()
        self.main_layout.addLayout(header_layout)

        # Subheader
        subheader = QLabel("Overview of Type mix, Flowrate distribution, and Pressure–Temperature relationships.")
        subheader.setStyleSheet(f"font-size:18px; opacity:0.75; margin-left:4px; margin-bottom:10px; color:{themes[self.theme_mode]['text']}")
        self.main_layout.addWidget(subheader)

        # Actions row
        actions = QHBoxLayout()
        self.upload_btn = self.styled_btn("Upload CSV")
        self.upload_btn.clicked.connect(self.upload_csv)
        actions.addWidget(self.upload_btn)
        self.view_table_btn = self.styled_btn("View Table")
        self.view_table_btn.clicked.connect(self.show_table)
        actions.addWidget(self.view_table_btn)
        self.download_pdf_btn = self.styled_btn("Download as PDF")
        self.download_pdf_btn.clicked.connect(self.download_pdf)
        actions.addWidget(self.download_pdf_btn)
        actions.addStretch()
        self.main_layout.addLayout(actions)

        # Stacked dashboard/table
        self.stack = QStackedLayout()
        # Dashboard page
        self.dashboard_widget = QWidget()
        dash_layout = QVBoxLayout()

        # KPI grid
        self.kpi_row = QHBoxLayout()
        self.kpi_cards = [
            KpiCard("Total Equipment", "—", "Entries parsed", themes[self.theme_mode]['kpi_gradients'][0], themes[self.theme_mode]),
            KpiCard("Avg Flowrate", "—", "P50 — • P90 —", themes[self.theme_mode]['kpi_gradients'][1], themes[self.theme_mode]),
            KpiCard("Avg Pressure", "—", "Min — • Max —", themes[self.theme_mode]['kpi_gradients'][2], themes[self.theme_mode]),
            KpiCard("Avg Temperature", "—", "P10 — • P90 —", themes[self.theme_mode]['kpi_gradients'][3], themes[self.theme_mode])
        ]
        for kpi in self.kpi_cards:
            self.kpi_row.addWidget(kpi)
        dash_layout.addLayout(self.kpi_row)
        dash_layout.addSpacing(16)

        # Chart grid — 3 charts with styled borders
        chart_grid = QHBoxLayout()
        self.fig, self.axs = plt.subplots(1, 3, figsize=(17, 5))
        plt.subplots_adjust(left=0.07, right=0.97, wspace=0.35)
        for ax, title in zip(self.axs, ["Equipment Type Mix", "Flowrate Distribution", "Pressure vs Temperature"]):
            ax.set_title(title, fontsize=16, color="#3fc1c9")
            ax.set_facecolor("#222e3c")
            # Ticks and numbers color
            ax.tick_params(colors=themes[self.theme_mode]['axis_text'], labelcolor=themes[self.theme_mode]['axis_text'])
            ax.xaxis.label.set_color(themes[self.theme_mode]['axis_text'])
            ax.yaxis.label.set_color(themes[self.theme_mode]['axis_text'])
        self.fig.patch.set_facecolor("#161f2a")
        self.canvas = FigureCanvas(self.fig)
        chart_grid.addWidget(self.canvas)
        dash_layout.addLayout(chart_grid)

        self.dashboard_widget.setLayout(dash_layout)
        self.stack.addWidget(self.dashboard_widget)

        # Table page with Back button
        self.table_widget = QWidget()
        table_layout = QVBoxLayout()
        back_btn = self.styled_btn("Back to Dashboard")
        back_btn.clicked.connect(self.show_dashboard)
        table_layout.addWidget(back_btn, alignment=Qt.AlignRight)
        self.table = QTableWidget()
        self.table.setStyleSheet(
            f"background:{themes[self.theme_mode]['panel']}; color:{themes[self.theme_mode]['text']};"
        )
        table_layout.addWidget(self.table)
        self.table_widget.setLayout(table_layout)
        self.stack.addWidget(self.table_widget)

        self.main_layout.addLayout(self.stack)
        self.setLayout(self.main_layout)
        self.show_dashboard()

    def styled_btn(self, label):
        btn = QPushButton(label)
        btn.setStyleSheet(f"""
            QPushButton {{
                font-size:19px;
                color: {themes[self.theme_mode]['btn_text']};
                background: {themes[self.theme_mode]['btn_bg']};
                border: 2.4px solid {themes[self.theme_mode]['border']};
                border-radius: 11px;
                padding: 10px 26px;
                margin: 12px 9px 0 0;
            }}
            QPushButton::hover {{
                background: {themes[self.theme_mode]['border']};
                color: #fff;
            }}
        """)
        return btn

    def upload_csv(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Select CSV file", "", "CSV files (*.csv)")
        print("File chosen:", file_path)
        if file_path:
            try:
                self.data = pd.read_csv(file_path)
                print("CSV successfully loaded! Columns:", self.data.columns)
            except Exception as e:
                print("Error reading CSV:", e)
                import traceback
                traceback.print_exc()
                return  # Stop if read fails
            self.headers = list(self.data.columns)
            success = upload_csv_to_backend(file_path)
            print("Upload to backend successful?", success)
            if success:
                print("File uploaded to backend.")
            self.process_dashboard()
            self.show_dashboard()

    def process_dashboard(self):
        eq_count = len(self.data) if not self.data.empty else "—"
        flow_stats = self.calculate_stats("Flowrate")
        pressure_stats = self.calculate_stats("Pressure")
        temp_stats = self.calculate_stats("Temperature")
        kpis = [
            (eq_count, "Entries parsed"),
            (flow_stats['mean'], f"P50 {flow_stats['p50']} • P90 {flow_stats['p90']}"),
            (pressure_stats['mean'], f"Min {pressure_stats['min']} • Max {pressure_stats['max']}"),
            (temp_stats['mean'], f"P10 {temp_stats['p10']} • P90 {temp_stats['p90']}")
        ]
        for idx, kpi in enumerate(self.kpi_cards):
            kpi.layout().itemAt(1).widget().setText(str(kpis[idx][0]))
            kpi.layout().itemAt(2).widget().setText(kpis[idx][1])
        for ax, title in zip(self.axs, ["Equipment Type Mix", "Flowrate Distribution", "Pressure vs Temperature"]):
            ax.clear()
            ax.set_title(title, fontsize=16, color="#3fc1c9")
            ax.set_facecolor("#222e3c")
            ax.tick_params(colors=themes[self.theme_mode]['axis_text'], labelcolor=themes[self.theme_mode]['axis_text'])
            ax.xaxis.label.set_color(themes[self.theme_mode]['axis_text'])
            ax.yaxis.label.set_color(themes[self.theme_mode]['axis_text'])
        # Equipment Type Mix
        if "Type" in self.data.columns:
            counts = self.data["Type"].value_counts()
            self.axs[0].bar(counts.index, counts.values, color=themes[self.theme_mode]['border'], edgecolor="#222e3c")
            self.axs[0].set_ylabel("Count")
        # Flowrate Distribution
        if "Flowrate" in self.data.columns:
            vals = pd.to_numeric(self.data["Flowrate"], errors='coerce').dropna()
            self.axs[1].hist(vals, bins=12, color=themes[self.theme_mode]['kpi_gradients'][1])
            self.axs[1].set_xlabel("Flowrate")
            self.axs[1].set_ylabel("Count")
        # Pressure vs Temperature
        if "Pressure" in self.data.columns and "Temperature" in self.data.columns:
            x = pd.to_numeric(self.data["Pressure"], errors='coerce')
            y = pd.to_numeric(self.data["Temperature"], errors='coerce')
            self.axs[2].scatter(x, y, color=themes[self.theme_mode]['kpi_gradients'][2])
            self.axs[2].set_xlabel("Pressure")
            self.axs[2].set_ylabel("Temperature")
        self.fig.patch.set_facecolor("#161f2a")
        self.canvas.draw()

    def calculate_stats(self, col):
        vals = pd.to_numeric(self.data[col], errors='coerce').dropna() if col in self.data.columns else pd.Series([])
        d = {
            'mean': f"{vals.mean():.2f}" if not vals.empty else "—",
            'min': f"{vals.min():.2f}" if not vals.empty else "—",
            'max': f"{vals.max():.2f}" if not vals.empty else "—",
            'p10': f"{np.percentile(vals, 10):.2f}" if not vals.empty else "—",
            'p50': f"{np.percentile(vals, 50):.2f}" if not vals.empty else "—",
            'p90': f"{np.percentile(vals, 90):.2f}" if not vals.empty else "—"
        }
        return d

    def show_table(self):
        if not self.data.empty:
            self.table.setRowCount(len(self.data))
            self.table.setColumnCount(len(self.headers))
            self.table.setHorizontalHeaderLabels(self.headers)
            for i, row in self.data.iterrows():
                for j, col in enumerate(self.headers):
                    val = str(row.get(col, ""))
                    self.table.setItem(i, j, QTableWidgetItem(val))
            self.table.setStyleSheet(
                f"background:{themes[self.theme_mode]['panel']}; color:{themes[self.theme_mode]['text']};"
            )
            self.stack.setCurrentWidget(self.table_widget)

    def show_dashboard(self):
        self.stack.setCurrentWidget(self.dashboard_widget)

    def download_pdf(self):
        from matplotlib.backends.backend_pdf import PdfPages
        file_path, _ = QFileDialog.getSaveFileName(self, "Save Dashboard as PDF", "", "PDF files (*.pdf)")
        if file_path:
            with PdfPages(file_path) as pdf:
                pdf.savefig(self.fig)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    dash = Dashboard()
    dash.show()
    sys.exit(app.exec_())
