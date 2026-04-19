<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $role = in_array($request->role, ['owner', 'viewer']) ? $request->role : 'owner';

        if (User::where('username', $request->username)->exists()) {
            return response()->json(['error' => 'Username already taken'], 400);
        }

        $user = User::create([
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role'     => $role,
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'token' => $token,
            'user'  => ['id' => $user->id, 'username' => $user->username, 'role' => $user->role],
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'token' => $token,
            'user'  => ['id' => $user->id, 'username' => $user->username, 'role' => $user->role],
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'id'       => $user->id,
            'username' => $user->username,
            'role'     => $user->role,
        ]);
    }
}
