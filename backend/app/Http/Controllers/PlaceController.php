<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PlaceController extends Controller
{
    public function autocomplete(Request $request)
    {
        $input = $request->query('input', '');
        if (! $input) {
            return response()->json(['predictions' => []]);
        }

        $key = env('VITE_GOOGLE_MAPS_KEY');
        if (!$key) {
            return response()->json(['error' => 'API key not found'], 500);
        }

        $url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
        $resp = Http::get($url, [
            'input' => $input,
            'key' => $key,
            'language' => 'ja',
        ]);

        if ($resp->ok()) {
            return response()->json($resp->json());
        }

        return response()->json(['predictions' => []], 500);
    }

    public function details(Request $request)
    {
        $placeId = $request->query('place_id', '');
        if (! $placeId) {
            return response()->json(['result' => null]);
        }

        $key = env('VITE_GOOGLE_MAPS_KEY');
        if (!$key) {
            return response()->json(['error' => 'API key not found'], 500);
        }

        $url = 'https://maps.googleapis.com/maps/api/place/details/json';
        $resp = Http::get($url, [
            'place_id' => $placeId,
            'key' => $key,
            'fields' => 'formatted_address,name,geometry',
            'language' => 'ja',
        ]);

        if ($resp->ok()) {
            return response()->json($resp->json());
        }

        return response()->json(['result' => null], 500);
    }
}