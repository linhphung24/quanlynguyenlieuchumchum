import { NextRequest, NextResponse } from 'next/server';
import { getRecipeIngredients } from '@/services/recipeService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const ingredients = await getRecipeIngredients(id);
    return NextResponse.json({ ingredients });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
