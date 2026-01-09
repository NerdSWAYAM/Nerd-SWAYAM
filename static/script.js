const canvas = document.getElementById('neural-network-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let network = [];
let angleY = 0;
const rotationSpeed = 0.002;

// Configuration for the Neural Network
const layerConfig = [6, 8, 8, 4]; // Number of neurons per layer
const layerDistance = 220; // Increased distance between layers along Z-axis (was 150)
const nodeSpacing = 60; // Increased distance between nodes vertically (was 40)

function resizeCanvas() {
    // Use the container's size or the element's actual display size
    // Note: canvas.width is the resolution, canvas.style.width is the display size.
    // We want resolution to match display size for 1:1 pixel mapping.

    // Check if canvas has a parent for context or just start with client dims
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;

    canvas.width = width;
    canvas.height = height;
    initNetwork();
}

// Node class for 3D points
class Node {
    constructor(x, y, z, layerIndex) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.layerIndex = layerIndex;
        // 2D Projection coordinates
        this.px = 0;
        this.py = 0;
        this.scale = 1;
    }

    project() {
        // Perspective projection
        const fov = 300;
        const viewDistance = 500;

        // Apply rotation around Y axis
        const cos = Math.cos(angleY);
        const sin = Math.sin(angleY);

        // Rotation logic
        let rx = this.x * cos - this.z * sin;
        let rz = this.x * sin + this.z * cos;
        let ry = this.y; // No rotation roughly X for now

        // Project to 2D
        // Add perspective: things further away (higher z) are smaller
        // We shift z by viewDistance to avoid division by zero or negative
        let scale = fov / (viewDistance + rz);

        this.px = rx * scale + width / 2;
        this.py = ry * scale + height / 2;
        this.scale = scale;
    }
}

function initNetwork() {
    network = [];
    // Create nodes based on configuration
    // Center the network in 3D Point (0,0,0) is center of rotation
    const totalLayers = layerConfig.length;

    layerConfig.forEach((count, layerIdx) => {
        // Calculate z position (layers spread along Z)
        // Center layers around Z=0
        const z = (layerIdx - (totalLayers - 1) / 2) * layerDistance;

        for (let i = 0; i < count; i++) {
            // Calculate y position (nodes spread along Y)
            // Center nodes around Y=0
            const y = (i - (count - 1) / 2) * nodeSpacing;

            // Random slight x wobble to make it less rigid look? No, structured is better for "Neural Network"
            const x = (Math.random() - 0.5) * 50; // Slight random spread on X for depth volume

            network.push(new Node(x, y, z, layerIdx));
        }
    });
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    // Update rotation
    angleY += rotationSpeed;

    // Project all nodes first
    network.forEach(node => node.project());

    // Draw connections
    // Connect each node in layer L to all nodes in layer L+1
    ctx.lineWidth = 0.5;
    for (const nodeA of network) {
        for (const nodeB of network) {
            if (nodeB.layerIndex === nodeA.layerIndex + 1) {
                // Determine opacity based on depth (scale)
                const depthAlpha = (nodeA.scale + nodeB.scale) / 2;
                // Fade out distant connections more
                ctx.strokeStyle = `rgba(160, 196, 255, ${depthAlpha * 0.3})`;

                ctx.beginPath();
                ctx.moveTo(nodeA.px, nodeA.py);
                ctx.lineTo(nodeB.px, nodeB.py);
                ctx.stroke();
            }
        }
    }

    // Draw nodes
    network.forEach(node => {
        const radius = 3 * node.scale;
        ctx.beginPath();
        ctx.arc(node.px, node.py, radius, 0, Math.PI * 2);

        // Color based on layer? Or just uniform
        // Input: Cyan, Hidden: Blue, Output: Purple/White
        if (node.layerIndex === 0) ctx.fillStyle = '#72efdd'; // Input
        else if (node.layerIndex === layerConfig.length - 1) ctx.fillStyle = '#ff9e00'; // Output (orange accent)
        else ctx.fillStyle = '#a0c4ff'; // Hidden

        ctx.globalAlpha = node.scale; // Fade distant nodes
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    requestAnimationFrame(animate);
}

window.addEventListener('resize', resizeCanvas);

// Init
resizeCanvas();
animate();

// --- Existing Scroll Animation Logic ---
// Intersection Observer for scroll animations
const sections = document.querySelectorAll('.section');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

sections.forEach(section => {
    observer.observe(section);
});

// Add CSS class for visibility animation dynamically
const style = document.createElement('style');
style.textContent = `
    .section {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.8s ease-out, transform 0.8s ease-out;
    }
    .section.visible {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);
