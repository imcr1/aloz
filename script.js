class PatternGame {
    constructor() {
        this.currentDifficulty = '';
        this.currentSubLevel = 1;
        this.currentPattern = [];
        this.basePattern = [];
        this.currentProfile = 1;
        
        // Start profile alternation
        setInterval(() => this.alternateProfile(), 2000);
        
        // Q mode pattern
        this.qModePattern = ['circle', 'square', 'triangle', 'circle', 'square', 'triangle', 'circle', 'square', 'triangle', 'circle'];
        
        // Define shape combinations for each difficulty level
        this.levelShapes = {
            easy: [
                ['circle', 'square'],
                ['circle', 'triangle'],
                ['square', 'triangle']
            ],
            medium: [
                ['circle', 'square', 'triangle'],
                ['circle', 'triangle', 'diamond'],
                ['square', 'triangle', 'diamond']
            ],
            hard: [
                ['circle', 'square', 'triangle', 'diamond'],
                ['circle', 'square', 'diamond', 'star'],
                ['triangle', 'diamond', 'star', 'heart']
            ]
        };

        this.setupEventListeners();
        this.toast = new bootstrap.Toast(document.getElementById('feedbackToast'), {
            autohide: true,
            delay: 2000
        });
    }

    initialize() {
        // Add event listeners for difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const difficulty = btn.getAttribute('data-difficulty');
                if (difficulty === 'qmode') {
                    this.showScreen('question-screen');
                } else {
                    this.startGame(difficulty);
                }
            });
        });

        // Add event listener for Q mode start button
        document.getElementById('start-qmode').addEventListener('click', () => {
            this.startQMode();
        });

        // Add event listener for restart button
        document.getElementById('restart-button').addEventListener('click', () => {
            this.restartGame();
        });

        // Add event listeners for profile navigation
        document.querySelectorAll('.profile-nav button').forEach(btn => {
            btn.addEventListener('click', () => {
                const profileId = btn.getAttribute('data-profile');
                this.switchProfile(profileId);
            });
        });
    }

    alternateProfile() {
        // Remove active class from current profile
        document.querySelectorAll('.profile-card').forEach(card => {
            card.classList.remove('active');
        });

        // Switch to next profile
        this.currentProfile = this.currentProfile === 1 ? 2 : 1;

        // Activate new profile
        document.querySelector(`.profile-card[data-profile="${this.currentProfile}"]`).classList.add('active');
    }

    playSound(type) {
        if (!this.soundEnabled || !this.sounds[type]) return;
        
        try {
            const sound = this.sounds[type];
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.log(`Error playing ${type} sound:`, error);
            });
        } catch (error) {
            console.log(`Error playing ${type} sound:`, error);
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('toggle-sound');
        const icon = btn.querySelector('.sound-icon');

        if (!this.soundEnabled) {
            btn.classList.add('muted');
            icon.textContent = '🔇';
            this.sounds.background.pause();
        } else {
            btn.classList.remove('muted');
            icon.textContent = '🔊';
            if (this.currentDifficulty) {
                this.playBackgroundMusic();
            }
        }

        localStorage.setItem('soundEnabled', this.soundEnabled);
    }

    playBackgroundMusic() {
        if (!this.soundEnabled || !this.sounds.background) return;

        try {
            const music = this.sounds.background;
            music.currentTime = 0;
            music.play().catch(error => {
                console.log('Background music failed to play:', error);
            });
        } catch (error) {
            console.log('Background music failed to play:', error);
        }
    }

    async playSound(type) {
        if (!this.soundEnabled || !this.sounds[type]) return;

        try {
            await this.initAudioContext();
            this.sounds[type].currentTime = 0;
            await this.sounds[type].play();
        } catch (error) {
            console.log(`Failed to play ${type} sound:`, error);
        }
    }

    setupEventListeners() {
        // Difficulty selection
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.target.closest('.menu-btn');
                if (button) {
                    this.showSubLevels(button.dataset.difficulty);
                }
            });
        });

        // Back button
        document.getElementById('back-to-difficulties').addEventListener('click', () => this.showDifficultyScreen());

        // Game controls
        document.getElementById('check-button').addEventListener('click', () => this.checkPattern());
        document.getElementById('next-button').addEventListener('click', () => this.nextPattern());
        document.getElementById('restart-button').addEventListener('click', () => this.restartGame());
        document.getElementById('reset-button').addEventListener('click', () => this.resetCurrentPattern());
    }

    resetCurrentPattern() {
        // Show check button and hide next button if it was shown
        document.getElementById('check-button').classList.remove('d-none');
        document.getElementById('next-button').classList.add('d-none');

        // Re-display the pattern which will clear all filled slots
        this.displayPattern();

        // Show toast message
        const toastEl = document.getElementById('feedbackToast');
        const toastBody = toastEl.querySelector('.toast-body');
        toastEl.classList.remove('success', 'error');
        toastEl.classList.add('info');
        toastBody.textContent = 'تم إعادة تعيين السؤال'; // Question has been reset
        this.toast.show();
    }

    showDifficultyScreen() {
        document.getElementById('sub-levels-screen').classList.add('d-none');
        document.getElementById('game-screen').classList.add('d-none');
        document.getElementById('start-screen').classList.remove('d-none');
    }

    showSubLevels(difficulty) {
        this.currentDifficulty = difficulty;
        const container = document.getElementById('sub-levels-container');
        container.innerHTML = '';

        // Create sub-level buttons
        this.levelShapes[difficulty].forEach((shapes, index) => {
            const btn = document.createElement('button');
            btn.className = 'sub-level-btn animate__animated animate__zoomIn';
            btn.style.animationDelay = `${(index + 1) * 0.2}s`;
            btn.dataset.difficulty = difficulty;
            btn.innerHTML = `
                <span class="level-number">${this.convertToArabicNumeral(index + 1)}</span>
                <div class="level-shapes">
                    ${shapes.map(shape => `<div class="mini-shape ${shape}"></div>`).join('')}
                </div>
            `;
            btn.addEventListener('click', () => this.startGame(difficulty, index + 1));
            container.appendChild(btn);
        });

        // Hide start screen and show sub-levels
        document.getElementById('start-screen').classList.add('d-none');
        document.getElementById('sub-levels-screen').classList.remove('d-none');
    }

    startGame(difficulty, subLevel) {
        this.currentDifficulty = difficulty;
        this.currentSubLevel = subLevel;
        document.getElementById('sub-levels-screen').classList.add('d-none');
        document.getElementById('game-screen').classList.remove('d-none');
        this.generatePatterns();
        this.displayPattern();
    }

    generatePatterns() {
        // Get shapes for current difficulty and sub-level
        const shapes = this.levelShapes[this.currentDifficulty][this.currentSubLevel - 1];
        
        // Generate base pattern using the selected shapes
        this.basePattern = [];
        for (let i = 0; i < shapes.length; i++) {
            this.basePattern.push(shapes[i]);
        }
    }

    createShape(type) {
        const shape = document.createElement('div');
        shape.className = 'shape draggable';
        shape.setAttribute('data-shape', type);
        
        let svg = '';
        switch(type) {
            case 'circle':
                svg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#FF6B6B"/></svg>';
                break;
            case 'square':
                svg = '<svg viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" fill="#4ECDC4"/></svg>';
                break;
            case 'triangle':
                svg = '<svg viewBox="0 0 100 100"><polygon points="50,10 90,90 10,90" fill="#45B7D1"/></svg>';
                break;
            case 'diamond':
                svg = '<svg viewBox="0 0 100 100"><polygon points="50,10 90,50 50,90 10,50" fill="#96CEB4"/></svg>';
                break;
        }
        shape.innerHTML = svg;
        this.setupDragAndDrop(shape);
        return shape;
    }

    setupDragAndDrop(element) {
        if (element.classList.contains('fixed')) return;

        element.draggable = true;
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.getAttribute('data-shape'));
            e.target.classList.add('dragging');
        });

        element.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
            document.querySelectorAll('.dragover').forEach(el => el.classList.remove('dragover'));
        });
    }

    setupDropZone(element) {
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!element.querySelector('.shape')) {
                e.dataTransfer.dropEffect = 'move';
                element.classList.add('dragover');
            }
        });

        element.addEventListener('dragleave', () => {
            element.classList.remove('dragover');
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('dragover');
            const draggedElement = document.querySelector('.dragging');
            
            if (draggedElement && !element.querySelector('.shape')) {
                // If dragging from shape bank, clone it
                if (draggedElement.parentElement.id === 'shape-bank') {
                    const clone = draggedElement.cloneNode(true);
                    this.setupDragAndDrop(clone);
                    element.appendChild(clone);
                } else {
                    // If dragging from another slot, move it
                    element.appendChild(draggedElement);
                }
                element.classList.add('filled');
                draggedElement.classList.remove('dragging');
            }
        });
    }

    displayExamplePatterns(basePattern) {
        const exampleContainers = document.querySelectorAll('.example-pattern');
        
        exampleContainers.forEach((container, index) => {
            container.innerHTML = '';
            // Show complete patterns in examples
            const patternLength = (index + 2) * basePattern.length;
            for (let i = 0; i < patternLength; i++) {
                const shape = this.createShape(basePattern[i % basePattern.length]);
                shape.classList.remove('draggable');
                container.appendChild(shape);
            }
        });
    }

    displayPattern() {
        const patternContainer = document.getElementById('pattern-container');
        const shapeBank = document.getElementById('shape-bank');
        patternContainer.innerHTML = '';
        shapeBank.innerHTML = '';

        // Get shapes for current difficulty and sub-level
        const shapes = this.levelShapes[this.currentDifficulty][this.currentSubLevel - 1];

        // Clear any previous patterns
        this.currentPattern = [];
        
        // Create pattern: show two complete sets and one incomplete set
        for (let repeat = 0; repeat < 2; repeat++) {
            shapes.forEach(shape => this.currentPattern.push(shape));
        }
        shapes.forEach(shape => this.currentPattern.push(shape));

        // For hard mode, determine random positions for blanks
        const patternLength = shapes.length;
        const totalSlots = patternLength * 3;
        let blankPositions;

        if (this.currentDifficulty === 'hard') {
            // In hard mode, randomly distribute blanks throughout the pattern
            const positions = Array.from({length: totalSlots}, (_, i) => i);
            blankPositions = new Set();
            
            // Randomly select positions for blanks
            while (blankPositions.size < patternLength) {
                const randomIndex = Math.floor(Math.random() * positions.length);
                blankPositions.add(positions[randomIndex]);
                positions.splice(randomIndex, 1);
            }
        } else {
            // In easy/medium mode, blanks are always at the end
            blankPositions = new Set(
                Array.from({length: patternLength}, (_, i) => i + (patternLength * 2))
            );
        }

        // Display pattern
        this.currentPattern.forEach((shape, index) => {
            const slot = document.createElement('div');
            slot.className = 'pattern-slot';
            slot.setAttribute('data-index', index);

            if (!blankPositions.has(index)) {
                const shapeEl = this.createShape(shape);
                shapeEl.classList.add('fixed');
                slot.appendChild(shapeEl);
                slot.classList.add('filled');
            } else {
                this.setupDropZone(slot);
            }
            patternContainer.appendChild(slot);
        });

        // Add shapes to the shape bank (one of each shape type)
        shapes.forEach(shape => {
            const shapeEl = this.createShape(shape);
            shapeBank.appendChild(shapeEl);
        });
    }

    setupDropZone(element) {
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            const shape = e.dataTransfer.getData('text/plain');
            if (!element.hasChildNodes()) {
                element.appendChild(this.createShape(shape));
                element.classList.add('filled');
            }
        });
    }

    checkPattern() {
        const slots = document.querySelectorAll('.pattern-slot');
        let isCorrect = true;

        // Get the pattern slots we need to check
        const patternToCheck = Array.from(slots).slice(-this.currentPattern.length);

        // Check each slot against the pattern
        patternToCheck.forEach((slot, index) => {
            const shape = slot.querySelector('.shape');
            if (!shape) {
                isCorrect = false;
                return;
            }
            const shapeType = shape.getAttribute('data-shape');
            if (shapeType !== this.currentPattern[index]) {
                isCorrect = false;
            }
        });

        // Show feedback
        const toastEl = document.getElementById('feedbackToast');
        const toastBody = toastEl.querySelector('.toast-body');
        toastEl.classList.remove('success', 'error');

        if (isCorrect) {
            toastEl.classList.add('success');
            toastBody.textContent = 'أحسنت! النمط صحيح';
            this.currentSubLevel++;
            
            if (this.currentSubLevel > 3) { // If completed all sublevels
                this.showScreen('congrats-screen');
            } else {
                document.getElementById('check-button').classList.add('d-none');
                document.getElementById('next-button').classList.remove('d-none');
            }
        } else {
            toastEl.classList.add('error');
            toastBody.textContent = 'حاول مرة أخرى';
        }

        const toast = new bootstrap.Toast(toastEl);
        toast.show();

        return isCorrect;
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.add('d-none');
        });

        // Show the requested screen
        document.getElementById(screenId).classList.remove('d-none');

        // Reset game state if going back to main menu
        if (screenId === 'start-screen') {
            this.currentSubLevel = 1;
            this.currentPattern = [];
            this.basePattern = [];
        }
    }

    nextPattern() {
        const maxSubLevels = this.levelShapes[this.currentDifficulty].length;
        if (this.currentSubLevel < maxSubLevels) {
            document.getElementById('check-button').classList.remove('d-none');
            document.getElementById('next-button').classList.add('d-none');
            this.generatePatterns();
            this.resetCurrentPattern();
        } else {
            this.showScreen('congrats-screen');
        }
    }

    showCongratsScreen() {
        document.getElementById('game-screen').classList.add('d-none');
        document.getElementById('congrats-screen').classList.remove('d-none');
    }

    convertToArabicNumeral(num) {
        const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return num.toString().split('').map(d => arabicNumerals[parseInt(d)]).join('');
    }

    startGame(difficulty) {
        this.currentDifficulty = difficulty;
        this.currentSubLevel = 1;
        this.generatePatterns();
        this.resetCurrentPattern();
        this.showScreen('game-screen');
    }

    startQMode() {
        this.currentPattern = this.qModePattern;
        this.basePattern = this.qModePattern.slice(0, 7); // Show first 7 shapes
        this.currentDifficulty = 'qmode';
        this.showScreen('game-screen');
    }

    restartGame() {
        this.currentDifficulty = '';
        this.currentSubLevel = 1;
        this.currentPattern = [];
        this.basePattern = [];
        this.showScreen('start-screen');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PatternGame();
});
