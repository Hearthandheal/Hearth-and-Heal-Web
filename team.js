/**
 * Hearth and Heal - Team Manager
 * Handles Team Data, Storage, and Image Compression
 */

const TeamManager = {
    STORAGE_KEY: 'hearth_team_data_v2',

    // Default Seed Data
    defaults: [
        {
            id: '1',
            name: 'Ms. Becky Waithera',
            role: 'Brand Ambassador - Face of the Brand',
            bio: 'Driving awareness and sales through product demonstrations, social media marketing, and customer engagement. Becky represents the heart and soul of Hearth & Heal.',
            image: 'assets/becky_waithera.png'
        },
        {
            id: '2',
            name: 'Mr. John Haggee Ouma',
            role: 'Chief Executive Officer - Founder',
            bio: 'Provides overall leadership and vision. Oversees strategy, operations, and partnerships to ensure the mission of healing and growth is fulfilled with integrity and impact.',
            image: 'assets/john_haggee_ouma.jpg' // Fallback to asset path
        },
        {
            id: '3',
            name: 'Jane Doe',
            role: 'Head of Spiritual Care',
            bio: 'Dedicated to providing spiritual guidance and fostering a connection with the divine for inner peace.',
            image: '' // No image placeholder
        },
        {
            id: '4',
            name: 'Michael Smith',
            role: 'Program Coordinator',
            bio: 'Passionate about organizing impactful community events that bring people together for healing.',
            image: ''
        },
        {
            id: '5',
            name: 'Emmanuel K. Letoiya',
            role: 'External Marketing',
            bio: 'Builds partnerships and expands our reach beyond the immediate community.',
            image: 'assets/emmanuel_k_letoiya.jpg'
        },
        {
            id: '6',
            name: 'Angela Elijah',
            role: 'Events Manager',
            bio: 'Orchestrates our community gatherings and wellness workshops.',
            image: 'assets/angela_elijah.jpg'
        }
    ],

    getAll: () => {
        const data = localStorage.getItem(TeamManager.STORAGE_KEY);
        return data ? JSON.parse(data) : TeamManager.defaults;
    },

    saveAll: (members) => {
        try {
            localStorage.setItem(TeamManager.STORAGE_KEY, JSON.stringify(members));
            return { success: true };
        } catch (e) {
            console.error("Storage Error", e);
            return { success: false, message: 'Storage full! Try using a smaller image.' };
        }
    },

    add: (member) => {
        const members = TeamManager.getAll();
        member.id = Date.now().toString(); // Simple ID
        members.push(member);
        return TeamManager.saveAll(members);
    },

    update: (id, updates) => {
        const members = TeamManager.getAll();
        const index = members.findIndex(m => m.id === id);
        if (index !== -1) {
            members[index] = { ...members[index], ...updates };
            return TeamManager.saveAll(members);
        }
        return { success: false, message: 'Member not found' };
    },

    delete: (id) => {
        const members = TeamManager.getAll();
        const newMembers = members.filter(m => m.id !== id);
        return TeamManager.saveAll(newMembers);
    },

    // Utilities
    resizeImage: (file, maxWidth = 300) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const scale = maxWidth / img.width;
                    const canvas = document.createElement('canvas');
                    canvas.width = maxWidth;
                    canvas.height = img.height * scale;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Compress to JPEG 0.7 quality
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
            };
            reader.onerror = error => reject(error);
        });
    }
};
