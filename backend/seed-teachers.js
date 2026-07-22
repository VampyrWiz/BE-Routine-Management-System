/**
 * Seed script to populate the Teacher collection from a JSON data file.
 *
 * Reads teacher records from `backend/dataJson/teacher-aero-mech.json`,
 * validates designations, caps maxWeeklyHours at 24, generates unique
 * short names, and creates or updates each teacher in MongoDB.
 *
 * Usage: node backend/seed-teachers.js
 */

const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const fs = require('fs');
const path = require('path');

// Load environment variables from the root directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Generates a short name from a full name by taking:
 * - 1 name → first 3 characters
 * - 2 names → first letter of each
 * - 3+ names → first letter of first 3 parts
 */
function generateShortName(fullName) {
function generateShortName(fullName) {
  const nameParts = fullName.split(' ').filter(part => part.length > 0);
  
  if (nameParts.length === 1) {
    // Single name - take first 3 characters
    return nameParts[0].substring(0, 3).toUpperCase();
  } else if (nameParts.length === 2) {
    // Two names - first letter of first + first letter of last
    return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  } else {
    // Multiple names - first letter of each of first 3 parts
    return nameParts.slice(0, 3).map(part => part[0]).join('').toUpperCase();
  }
}

/**
 * Fallback short-name generator for conflict resolution.
 * Takes 2 letters from the first name + 1 letter from the last name.
 */
function generateAlternativeShortName(fullName) {
  const nameParts = fullName.split(' ').filter(part => part.length > 0);
  
  if (nameParts.length === 1) {
    // Single name - take first 3 characters
    return nameParts[0].substring(0, 3).toUpperCase();
  } else if (nameParts.length >= 2) {
    // Two or more names - 2 letters from first + 1 from last
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    
    const firstPart = firstName.length >= 2 ? firstName.substring(0, 2) : firstName;
    const lastPart = lastName[0];
    
    return (firstPart + lastPart).toUpperCase();
  }
  
  return generateShortName(fullName);
}

/**
 * Ensures the generated short name is unique across all teachers.
 * If a conflict is found, tries the alternative short-name strategy,
 * and if that also collides, appends incrementing integers.
 */
async function ensureUniqueShortName(fullName, originalShortName) {
  let shortName = originalShortName;
  
  // Check if the original short name already exists
  const existingWithSameShortName = await Teacher.findOne({ shortName: shortName });
  
  if (existingWithSameShortName && existingWithSameShortName.fullName !== fullName) {
    // Short name conflict - try alternative approach
    shortName = generateAlternativeShortName(fullName);
    console.log(`⚠️  Short name conflict for ${fullName}: "${originalShortName}" -> "${shortName}"`);
    
    // If still conflicts, add numbers
    let counter = 1;
    let baseShortName = shortName;
    while (await Teacher.findOne({ shortName: shortName })) {
      shortName = baseShortName + counter;
      counter++;
    }
    
    if (shortName !== baseShortName) {
      console.log(`⚠️  Further conflict resolved for ${fullName}: "${baseShortName}" -> "${shortName}"`);
    }
  }
  
  return shortName;
}

/**
 * Connects to MongoDB using the URI from environment variables.
 * Tries MONGODB_URI, MONGODB_ATLAS_URI, and MONGO_URI in order.
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_ATLAS_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI not found. Please set MONGODB_URI, MONGODB_ATLAS_URI, or MONGO_URI in environment variables.');
    }

    await mongoose.connect(mongoURI.trim());
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Reads teacher data from a JSON file and upserts each record into the
 * Teacher collection. Validates designations, caps hours, and ensures
 * every teacher gets a unique shortName. Logs a summary on completion.
 */
const seedElectricalTeachers = async () => {
  try {
    console.log('🚀 Starting electrical teachers data seeding...');
    
    // Read the electrical teachers JSON file
    const filePath = path.join(__dirname, 'dataJson', 'teacher-aero-mech.json');
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const teachersData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`📄 Loaded ${teachersData.length} teachers from teacher-aero-mech.json`);
    
    let updatedCount = 0;
    let createdCount = 0;
    let errorCount = 0;
    
    // Valid designations from the Teacher model
    const validDesignations = [
      'Professor',
      'Associate Professor', 
      'Assistant Professor',
      'Senior Lecturer',
      'Lecturer',
      'Teaching Assistant',
      'Lab Instructor',
      'Sr. Instructor',
      'Deputy Instructor',
      'Instructor',
      'Chief Technical Assistant',
      'Asst. Instuctor',
      'Office Assistant',
      'RA',
      'TA',
      'Office Attendant',
      'Chief Account Assistant'
    ];
    
    for (const teacherData of teachersData) {
      try {
        // Clean and validate the data
        const cleanedData = { ...teacherData };
        
        // Fix maxWeeklyHours constraint (max 24)
        if (cleanedData.maxWeeklyHours > 24) {
          console.log(`⚠️  Adjusting maxWeeklyHours for ${cleanedData.fullName}: ${cleanedData.maxWeeklyHours} -> 24`);
          cleanedData.maxWeeklyHours = 24;
        }
        
        // Fix designation if not valid
        if (!validDesignations.includes(cleanedData.designation)) {
          console.log(`⚠️  Invalid designation for ${cleanedData.fullName}: "${cleanedData.designation}" -> "Instructor"`);
          cleanedData.designation = 'Instructor';
        }
        
        // Ensure unique short name
        if (cleanedData.shortName) {
          cleanedData.shortName = await ensureUniqueShortName(cleanedData.fullName, cleanedData.shortName);
        } else {
          // Generate short name if not provided
          const generatedShortName = generateShortName(cleanedData.fullName);
          cleanedData.shortName = await ensureUniqueShortName(cleanedData.fullName, generatedShortName);
        }
        
        // Check if teacher already exists by fullName
        const existingTeacher = await Teacher.findOne({ fullName: cleanedData.fullName });
        
        if (existingTeacher) {
          // Update existing teacher
          const updatedTeacher = await Teacher.findOneAndUpdate(
            { fullName: cleanedData.fullName },
            cleanedData,
            { new: true, runValidators: true }
          );
          console.log(`✅ Updated: ${updatedTeacher.fullName} (${updatedTeacher.shortName})`);
          updatedCount++;
        } else {
          // Create new teacher
          const newTeacher = new Teacher(cleanedData);
          const savedTeacher = await newTeacher.save();
          console.log(`🆕 Created: ${savedTeacher.fullName} (${savedTeacher.shortName})`);
          createdCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${teacherData.fullName}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Seeding Summary:');
    console.log(`   📝 Total teachers processed: ${teachersData.length}`);
    console.log(`   🆕 Created: ${createdCount}`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All electrical teachers data seeded successfully!');
    } else {
      console.log('\n⚠️  Some errors occurred during seeding. Check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Error during seeding process:', error);
    process.exit(1);
  }
};

/**
 * Entry point: connects to the database, runs the seeding process,
 * then closes the connection and exits.
 */
const main = async () => {
  try {
    await connectDB();
    await seedElectricalTeachers();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    console.log('🔚 Closing database connection...');
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⛔ Received SIGINT. Gracefully shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⛔ Received SIGTERM. Gracefully shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the script
main();
