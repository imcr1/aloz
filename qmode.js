class QModeGame {
    constructor() {
        this.correctPattern = ['circle', 'square', 'triangle', 'circle', 'square', 'triangle', 'circle', 'square', 'triangle', 'circle'];
        this.slots = [];
        this.currentPattern = Array(10).fill(null);
        this.initialize();
    }

    initialize() {
        // Add event listener for Q mode button
        document.getElementById('qmode-btn').addEventListener('click', () => {
            document.getElementById('start-screen').classList.add('d-none');
            document.getElementById('question-screen').classList.remove('d-none');
        });

        // Add event listener for start solving button
        document.getElementById('start-qmode').addEventListener('click', () => {
            document.getElementById('question-screen').classList.add('d-none');
            document.getElementById('qmode-screen').classList.remove('d-none');
            this.createPatternSlots();
            this.initializeDragAndDrop();
        });

        // Add event listener for back button
        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.hideQMode();
        });

        // Add event listener for check button
        document.getElementById('check-qmode').addEventListener('click', () => {
            this.checkPattern();
        });
    }

    showQMode() {
        // Hide all other screens
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.add('d-none');
        });

        // Show Q mode screen
        document.getElementById('qmode-screen').classList.remove('d-none');

        // Create pattern slots
        this.createPatternSlots();
    }

    hideQMode() {
        document.getElementById('qmode-screen').classList.add('d-none');
        document.getElementById('question-screen').classList.add('d-none');
        document.getElementById('start-screen').classList.remove('d-none');
        this.currentPattern = Array(10).fill(null);
    }

    createPatternSlots() {
        const slotsContainer = document.querySelector('#qmode-screen .pattern-slots');
        slotsContainer.innerHTML = ''; // Clear existing slots
        this.slots = [];

        // Create 10 slots
        for (let i = 0; i < 10; i++) {
            const slot = document.createElement('div');
            slot.className = 'pattern-slot';
            slot.dataset.position = i;
            
            // Add position number
            const posNumber = document.createElement('div');
            posNumber.className = 'position-number';
            posNumber.textContent = (i + 1).toString();
            slot.appendChild(posNumber);

            slotsContainer.appendChild(slot);
            this.slots.push(slot);
        }
    }

    initializeDragAndDrop() {
        // Make shapes draggable
        const shapes = document.querySelectorAll('.shape-bank .shape');
        shapes.forEach(shape => {
            // Remove existing listeners
            const newShape = shape.cloneNode(true);
            shape.parentNode.replaceChild(newShape, shape);
            
            // Add drag listeners
            newShape.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', newShape.dataset.shape);
                newShape.classList.add('dragging');
            });
            
            newShape.addEventListener('dragend', () => {
                newShape.classList.remove('dragging');
            });
        });

        // Handle slots
        this.slots.forEach(slot => {
            // Remove existing listeners
            const newSlot = slot.cloneNode(true);
            slot.parentNode.replaceChild(newSlot, slot);
            
            // Add drag and drop listeners
            newSlot.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!newSlot.querySelector('.shape')) {
                    newSlot.classList.add('drag-over');
                }
            });

            newSlot.addEventListener('dragleave', () => {
                newSlot.classList.remove('drag-over');
            });

            newSlot.addEventListener('drop', (e) => {
                e.preventDefault();
                newSlot.classList.remove('drag-over');
                const shapeType = e.dataTransfer.getData('text/plain');

                if (!newSlot.querySelector('.shape')) {
                    const shape = document.createElement('div');
                    shape.className = `shape ${shapeType}`;
                    shape.dataset.shape = shapeType;

                    // Create SVG element
                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('viewBox', '0 0 100 100');

                    // Create shape element based on type
                    let shapeElement;
                    switch(shapeType) {
                        case 'circle':
                            shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                            shapeElement.setAttribute('cx', '50');
                            shapeElement.setAttribute('cy', '50');
                            shapeElement.setAttribute('r', '40');
                            break;
                        case 'square':
                            shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                            shapeElement.setAttribute('x', '10');
                            shapeElement.setAttribute('y', '10');
                            shapeElement.setAttribute('width', '80');
                            shapeElement.setAttribute('height', '80');
                            break;
                        case 'triangle':
                            shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                            shapeElement.setAttribute('points', '50,10 90,90 10,90');
                            break;
                    }
                    shapeElement.setAttribute('fill', 'currentColor');
                    svg.appendChild(shapeElement);
                    shape.appendChild(svg);

                    // Add shape text
                    const shapeText = document.createElement('span');
                    shapeText.className = 'shape-text';
                    shapeText.textContent = this.getShapeName(shapeType);
                    shape.appendChild(shapeText);

                    newSlot.appendChild(shape);
                    
                    const position = parseInt(newSlot.dataset.position);
                    this.currentPattern[position] = shapeType;

                    // Make dropped shape removable
                    shape.addEventListener('click', () => {
                        shape.remove();
                        this.currentPattern[position] = null;
                    });
                }
            });
        });

        // Update slots array with new elements
        this.slots = Array.from(document.querySelectorAll('.pattern-slot'));
    }

    getShapeName(shape) {
        const names = {
            'circle': 'دائرة',
            'square': 'مربع',
            'triangle': 'مثلث'
        };
        return names[shape];
    }

    showFeedback(message, isSuccess) {
        const toastEl = document.getElementById('feedbackToast');
        const toastBody = toastEl.querySelector('.toast-body');
        toastBody.textContent = message;
        toastEl.className = `toast align-items-center ${isSuccess ? 'bg-success' : 'bg-danger'} text-white`;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }

    checkPattern() {
        // Check if all slots are filled
        if (this.currentPattern.includes(null)) {
            this.showFeedback('يرجى ملء جميع الفراغات', false);
            return;
        }

        // Check if pattern is correct
        const isCorrect = this.currentPattern.every((shape, index) => shape === this.correctPattern[index]);

        if (isCorrect) {
            this.showFeedback('أحسنت! إجابة صحيحة', true);
        } else {
            this.showFeedback('حاول مرة أخرى', false);
        }
    }
}

// Initialize Q Mode game
document.addEventListener('DOMContentLoaded', () => {
    new QModeGame();
});
