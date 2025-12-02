class PhantomNotes {
  constructor() {
    this.notes = [];
    this.noteIdCounter = 0;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.currentDragNote = null;

    this.init();
  }

  init() {
    this.loadNotes();
    this.setupEventListeners();
    this.setupCursorGlow();
    this.renderNotes();
  }

  setupEventListeners() {
    document.getElementById('addNoteBtn').addEventListener('click', () => {
      this.createNote();
    });

    // Keyboard shortcut to create new note
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        this.createNote();
      }
    });
  }

  setupCursorGlow() {
    // No longer needed - using CSS cursor instead
  }

  createNote() {
    const note = {
      id: ++this.noteIdCounter,
      title: '',
      content: '',
      x: window.innerWidth - 300, // Top right position (note width is 250px + margin)
      y: 200, // Below header
      timestamp: new Date().toLocaleString()
    };

    this.notes.push(note);
    this.saveNotes();
    this.renderNotes();

    // Focus on the new note's title
    setTimeout(() => {
      const noteElement = document.querySelector(`[data-note-id="${note.id}"] .note-title`);
      if (noteElement) {
        noteElement.focus();
      }
    }, 100);
  }

  deleteNote(id) {
    this.notes = this.notes.filter(note => note.id !== id);
    this.saveNotes();
    this.renderNotes();
  }

  updateNote(id, field, value) {
    const note = this.notes.find(n => n.id === id);
    if (note) {
      note[field] = value;
      if (field === 'title' || field === 'content') {
        note.timestamp = new Date().toLocaleString();
      }
      this.saveNotes();
    }
  }

  updateNotePosition(id, x, y) {
    const note = this.notes.find(n => n.id === id);
    if (note) {
      note.x = x;
      note.y = y;
      this.saveNotes();
    }
  }

  renderNotes() {
    const container = document.getElementById('notesContainer');
    
    if (this.notes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="ghost-icon">👻</div>
          <h2>No phantom notes yet...</h2>
          <p>Summon your first ethereal note to begin</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.notes.map(note => `
      <div class="phantom-note" 
           data-note-id="${note.id}"
           style="left: ${note.x}px; top: ${note.y}px;">
        <div class="note-header">
          <input type="text" 
                 class="note-title" 
                 placeholder="Untitled phantom..." 
                 value="${note.title}"
                 data-field="title">
          <button class="delete-btn" data-action="delete">×</button>
        </div>
        <textarea class="note-content" 
                  placeholder="Your ghostly thoughts drift here..."
                  data-field="content">${note.content}</textarea>
        <div class="note-timestamp">${note.timestamp}</div>
      </div>
    `).join('');

    this.attachNoteEventListeners();
  }

  attachNoteEventListeners() {
    const notes = document.querySelectorAll('.phantom-note');
    
    notes.forEach(noteElement => {
      const noteId = parseInt(noteElement.dataset.noteId);
      
      // Delete button
      const deleteBtn = noteElement.querySelector('[data-action="delete"]');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteNote(noteId);
      });

      // Input events
      const titleInput = noteElement.querySelector('[data-field="title"]');
      const contentTextarea = noteElement.querySelector('[data-field="content"]');

      titleInput.addEventListener('input', (e) => {
        this.updateNote(noteId, 'title', e.target.value);
      });

      contentTextarea.addEventListener('input', (e) => {
        this.updateNote(noteId, 'content', e.target.value);
      });

      // Dragging functionality
      let isDragging = false;
      let dragOffset = { x: 0, y: 0 };

      const startDrag = (e) => {
        if (e.target.classList.contains('note-title') || 
            e.target.classList.contains('note-content') ||
            e.target.classList.contains('delete-btn')) {
          return;
        }

        isDragging = true;
        noteElement.classList.add('dragging');
        
        // Get current position of the note
        const currentX = parseInt(noteElement.style.left) || 0;
        const currentY = parseInt(noteElement.style.top) || 0;
        
        // Calculate offset from current position
        dragOffset.x = e.clientX - currentX;
        dragOffset.y = e.clientY - currentY;

        e.preventDefault();
      };

      const drag = (e) => {
        if (!isDragging) return;

        // Calculate new position maintaining the exact click offset
        let x = e.clientX - dragOffset.x;
        let y = e.clientY - dragOffset.y;

        // No grid snapping during drag - smooth movement
        // Allow notes to go anywhere on screen - no Y restrictions
        const maxX = window.innerWidth - 50;
        const maxY = window.innerHeight + 500; // Allow way below screen
        
        const boundedX = Math.max(-50, Math.min(x, maxX));
        const boundedY = Math.max(0, Math.min(y, maxY)); // Allow Y=0 (top of screen)

        noteElement.style.left = boundedX + 'px';
        noteElement.style.top = boundedY + 'px';
      };

      const endDrag = () => {
        if (!isDragging) return;
        
        isDragging = false;
        noteElement.classList.remove('dragging');
        noteElement.classList.add('positioning');
        
        // Aggressive snap to nearby notes for perfect alignment
        let x = parseInt(noteElement.style.left);
        let y = parseInt(noteElement.style.top);
        
        console.log('Current position before snap:', x, y);
        
        // Less aggressive snapping - more natural feel
        const rowSnapDistance = 40; // Reduced from 100 to 40
        const colSnapDistance = 30;  // Reduced from 60 to 30
        const allNotes = document.querySelectorAll('.phantom-note:not(.positioning)');
        
        let targetY = null;
        let targetX = null;
        
        // First pass: Look for row alignment (Y position)
        allNotes.forEach(otherNote => {
          if (otherNote === noteElement) return;
          
          const otherY = parseInt(otherNote.style.top) || 0;
          const yDistance = Math.abs(y - otherY);
          
          // Very generous row snapping
          if (yDistance < rowSnapDistance) {
            targetY = otherY;
            console.log('ROW SNAP: Will snap to Y:', otherY, 'distance was:', yDistance);
          }
        });
        
        // Second pass: Look for column alignment (X position) only if not too close
        allNotes.forEach(otherNote => {
          if (otherNote === noteElement) return;
          
          const otherX = parseInt(otherNote.style.left) || 0;
          const xDistance = Math.abs(x - otherX);
          
          if (xDistance < colSnapDistance) {
            targetX = otherX;
            console.log('COLUMN SNAP: Will snap to X:', otherX, 'distance was:', xDistance);
          }
        });
        
        // Apply snapping - ROW FIRST (most important)
        if (targetY !== null) {
          y = targetY;
          console.log('✅ SNAPPED TO ROW Y:', targetY);
        }
        
        if (targetX !== null) {
          x = targetX;
          console.log('✅ SNAPPED TO COLUMN X:', targetX);
        }
        
        // Force the position update
        noteElement.style.left = x + 'px';
        noteElement.style.top = y + 'px';
        noteElement.style.transform = 'none'; // Remove any transforms that might interfere
        
        // Remove positioning class after a delay
        setTimeout(() => {
          noteElement.classList.remove('positioning');
        }, 200);
        
        this.updateNotePosition(noteId, x, y);
      };

      noteElement.addEventListener('mousedown', startDrag);
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', endDrag);

      // Touch events for mobile
      noteElement.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startDrag({
          clientX: touch.clientX,
          clientY: touch.clientY,
          target: e.target,
          preventDefault: () => e.preventDefault()
        });
      });

      document.addEventListener('touchmove', (e) => {
        if (isDragging) {
          const touch = e.touches[0];
          drag({
            clientX: touch.clientX,
            clientY: touch.clientY
          });
        }
      });

      document.addEventListener('touchend', endDrag);
    });
  }

  saveNotes() {
    localStorage.setItem('phantomNotes', JSON.stringify(this.notes));
  }

  loadNotes() {
    const saved = localStorage.getItem('phantomNotes');
    if (saved) {
      this.notes = JSON.parse(saved);
      this.noteIdCounter = Math.max(...this.notes.map(n => n.id), 0);
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PhantomNotes();
});

// Add some spooky sound effects (optional)
function playGhostlySound() {
  // Create a simple ethereal sound using Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.5);
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 1);
}

// Add ethereal particles on note creation
function createEtherealParticles(x, y) {
  for (let i = 0; i < 5; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.width = '4px';
    particle.style.height = '4px';
    particle.style.background = 'rgba(138, 43, 226, 0.8)';
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999';
    particle.style.boxShadow = '0 0 10px rgba(138, 43, 226, 0.8)';
    
    document.body.appendChild(particle);

    // Animate particle
    const angle = (Math.PI * 2 * i) / 5;
    const distance = 50 + Math.random() * 50;
    const endX = x + Math.cos(angle) * distance;
    const endY = y + Math.sin(angle) * distance;

    particle.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${endX - x}px, ${endY - y}px) scale(0)`, opacity: 0 }
    ], {
      duration: 1000 + Math.random() * 500,
      easing: 'ease-out'
    }).onfinish = () => {
      particle.remove();
    };
  }
}