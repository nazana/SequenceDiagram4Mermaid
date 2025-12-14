# Mermaid Sequence Diagram Editor

A powerful, visual editor for [Mermaid](https://mermaid.js.org/) sequence diagrams.  
No more syntax errors. No more manual ASCII art. Just drag, drop, and click.

![Mermaid Editor Preview](https://via.placeholder.com/800x400?text=Mermaid+Editor+Feature+Graphic)

## ✨ Features

- **Dual Editor System**: Real-time sync between Grid UI (Excel-like) and Markdown Code.
- **Smart Validation**: Automatically corrects invalid activation/deactivation sequences.
- **Interactive Viewer**: Zoom & Pan support for navigating large diagrams.
- **Visual Controls**:
  - Drag & Drop reordering (rows).
  - One-click Arrow Type swapping.
  - One-click Participant swapping.
  - Visual Activation (+/-) control.
- **Safe & Local**: All data is stored in your browser's Local Storage. Zero server transmission.
- **Version History**: Built-in revision control to undo changes.

## 🚀 Quick Start (via npx)

Run instantly without installing anything:

```bash
npx github:nazana/SequenceDiagram4Mermaid
```

This will start a local server and open the editor in your default browser.

## 📦 Installation (Local)

If you prefer to clone and run locally:

1.  **Clone the repository**
    ```bash
    git clone https://github.com/nazana/SequenceDiagram4Mermaid.git
    cd SequenceDiagram4Mermaid
    ```

2.  **Run directly**
    Simply open `index.html` in your browser. (Ideally via a local server like Live Server for best performance).

    *Or use the included CLI script:*
    ```bash
    npm install
    npm start
    ```

## 📖 User Guide

A complete user guide is included in the application.
Click the **Guide** button in the header or visit `guide.html` after launching.

## 🛠 Tech Stack

- **Core**: Vanilla JavaScript (ES Modules), HTML5, CSS3
- **Rendering**: Mermaid.js
- **Icons**: Phosphor Icons
- **Utility**: Sortable.js (DnD), Panzoom (Viewer)

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
