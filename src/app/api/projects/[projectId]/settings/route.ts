import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/projects/[projectId]/settings
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Await params before using its properties
    const paramsCopy = await Promise.resolve(params);
    const projectId = paramsCopy.projectId;
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    
    // Find the project
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId)
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Return the project settings
    return NextResponse.json({ 
      settings: project.settings || {} 
    });
  } catch (error) {
    console.error('Error fetching project settings:', error);
    return NextResponse.json({ error: 'Failed to fetch project settings' }, { status: 500 });
  }
}

// PUT /api/projects/[projectId]/settings
export async function PUT(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Await params before using its properties
    const paramsCopy = await Promise.resolve(params);
    const projectId = paramsCopy.projectId;
    const { settings } = await req.json();
    
    if (!settings) {
      return NextResponse.json({ error: 'Settings are required' }, { status: 400 });
    }
    
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    
    // Find the project
    const project = await db.collection('projects').findOne({
      _id: new ObjectId(projectId)
    });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Update project settings
    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { 
        $set: { 
          settings,
          updatedAt: new Date() 
        } 
      }
    );
    
    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to update project settings' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating project settings:', error);
    return NextResponse.json({ error: 'Failed to update project settings' }, { status: 500 });
  }
} 