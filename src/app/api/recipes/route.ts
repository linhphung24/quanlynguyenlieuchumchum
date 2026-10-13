import { NextRequest, NextResponse } from 'next/server';
import { getAllRecipes, saveRecipe, deleteRecipe } from '@/services/recipeService';
import { getCurrentUser } from '@/lib/serverUtils';

export async function GET() {
  try {
    const recipes = await getAllRecipes();
    return NextResponse.json({ recipes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipe, ingredients } = body;
    const currentUser = getCurrentUser(req, body, 'system');

    const id = await saveRecipe(recipe, ingredients || [], currentUser);
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    const currentUser = getCurrentUser(req, undefined, 'system');

    await deleteRecipe(Number(id), currentUser);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
