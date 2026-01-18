const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const Chat = require('./models/Chat');

const initializeDatabase = async () => {
    try {
        // Connect to MongoDB
        const connection = await mongoose.connect('mongodb://localhost:27017/social-media-app', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Drop the database if it exists
        console.log('Dropping existing database...');
        await connection.connection.dropDatabase();
        console.log('Database dropped successfully');

        // Reconnect to create new database
        await mongoose.connect('mongodb://localhost:27017/social-media-app', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Create collections
        await connection.connection.createCollection('users');
        await connection.connection.createCollection('posts');
        await connection.connection.createCollection('chats');
        console.log('Collections created successfully');

        // Create indexes
        await User.collection.createIndex({ username: 1 }, { unique: true });
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await Post.collection.createIndex({ author: 1 });
        await Chat.collection.createIndex({ participants: 1 });
        console.log('Indexes created successfully');

        console.log('\nDatabase initialization completed successfully!');
        console.log('The following collections are ready:');
        console.log('- users (with indexes on username and email)');
        console.log('- posts (with index on author)');
        console.log('- chats (with index on participants)');

        // Close the connection
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');

    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};

// Run the initialization
initializeDatabase(); 