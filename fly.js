// Optimized fly animation - reacts to cursor
function initFly() {
  const fly = document.getElementById('fly');
  if (!fly) return;

  let currentX = Math.random() * (window.innerWidth - 50);
  let currentY = Math.random() * (window.innerHeight - 50);
  let isMoving = false;
  
  fly.style.left = currentX + 'px';
  fly.style.top = currentY + 'px';

  const FLEE_DISTANCE = 32; // Distance at which fly reacts to cursor

  function moveFlyToRandomPosition() {
    if (isMoving) return; // Don't interrupt current movement
    
    isMoving = true;
    
    // Pick completely random position within viewport
    const newX = Math.random() * (window.innerWidth - 50);
    const newY = Math.random() * (window.innerHeight - 50);
    
    // Calculate angle for rotation
    const deltaX = newX - currentX;
    const deltaY = newY - currentY;
    // Convert radians to degrees and add 90° offset for emoji orientation
    const angle = (Math.atan2(deltaY, deltaX) * (180 / Math.PI)) + 90;
    
    // Apply rotation directly
    fly.style.transform = `rotate(${angle}deg)`;
    
    // Add flying animation
    fly.classList.add('flying');
    
    // Move fly directly to new position
    fly.style.left = newX + 'px';
    fly.style.top = newY + 'px';
    
    // Update current position
    currentX = newX;
    currentY = newY;
    
    // Remove flying animation after movement completes
    setTimeout(() => {
      fly.classList.remove('flying');
      // Set final rotation without scale
      fly.style.transform = `rotate(${angle}deg)`;
      isMoving = false;
    }, 1500); // Match the transition duration
  }

  // Track mouse movement
  document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Calculate distance from fly to cursor
    const deltaX = currentX - mouseX;
    const deltaY = currentY - mouseY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // If cursor is too close, fly to random position
    if (distance < FLEE_DISTANCE && !isMoving) {
      moveFlyToRandomPosition();
    }
  });
}

// Initialize fly when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFly);
} else {
  initFly();
}
