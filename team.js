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
            image: 'assets/john_haggee_ouma.jpg'
        },
        {
            id: '3',
            name: 'Ms. Faith Emusugut',
            role: 'Secretary General',
            bio: 'Oversees administration, compliance, and organizational efficiency.',
            image: 'assets/faith_emusugut_v3.jpg'
        },
        {
            id: '4',
            name: 'Mr. Graham Ouma',
            role: 'Publications Editor',
            bio: 'Curates and refines our written content to ensure clarity and impact.',
            image: 'assets/graham_ouma.png'
        },
        {
            id: '5',
            name: 'Ms. Angela Elijah',
            role: 'Events Manager',
            bio: 'Orchestrates our community gatherings and wellness workshops.',
            image: 'assets/angela_elijah.jpg'
        },
        {
            id: '6',
            name: 'Ms. Sarah Gacoki',
            role: 'Graphic Designer',
            bio: 'Crafts visual assets and design materials to keep our brand vibrant and engaging.',
            image: 'assets/sarah_gacoki.jpg'
        },
        {
            id: '7',
            name: 'Mr. Emmanuel K. Letoiya',
            role: 'External Marketing',
            bio: 'Builds partnerships and expands our reach beyond the immediate community.',
            image: 'assets/emmanuel_k_letoiya.jpg'
        },
        {
            id: '8',
            name: 'Mrs. Diana Chepkoech',
            role: 'Social Media Manager',
            bio: 'Connects with our digital community through inspiring content.',
            image: 'assets/diana_chepkoech.jpg'
        },
        {
            id: '9',
            name: 'Mr. Gideon Eyinda',
            role: 'Videographer',
            bio: 'Captures our moments and stories through visual media.',
            image: 'assets/gideon_eyinda.jpg'
        },
        {
            id: '10',
            name: 'Mr. Conrad Lutomia',
            role: 'Videographer',
            bio: 'Captures our moments and stories through visual media.',
            image: 'assets/conrad_lutomia.jpg'
        },
        {
            id: '11',
            name: 'Ms. Gloria Otieno',
            role: 'Communications Manager',
            bio: 'Ensures our message is heard clearly across all channels.',
            image: 'assets/gloria_atieno_new.png'
        },
        {
            id: '12',
            name: 'Olaf',
            role: 'Wellness Companion',
            bio: 'Spreads warmth and support throughout our community as Hearth & Heal’s friendly helper.',
            image: 'assets/olaf_new.jpg'
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
