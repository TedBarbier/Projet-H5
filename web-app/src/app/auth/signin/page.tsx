'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignInPage() {
    const router = useRouter();
    const [data, setData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');

    const loginUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email: data.email,
                password: data.password,
            });

            if (result?.error) {
                setError("Email ou mot de passe incorrect.");
            } else {
                // Successful login
                router.push('/feed');
                router.refresh();
            }
        } catch (error) {
            setError("Une erreur est survenue.");
        }
    };

    return (
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                    Se connecter
                </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form className="space-y-6" onSubmit={loginUser}>
                    <div>
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                            Adresse Email
                        </label>
                        <div className="mt-2">
                            <input
                                type="email"
                                required
                                value={data.email}
                                onChange={(e) => setData({ ...data, email: e.target.value })}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-2"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium leading-6 text-gray-900">
                                Mot de passe
                            </label>
                        </div>
                        <div className="mt-2">
                            <input
                                type="password"
                                required
                                value={data.password}
                                onChange={(e) => setData({ ...data, password: e.target.value })}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-2"
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Se connecter
                        </button>
                    </div>
                </form>

                <p className="mt-10 text-center text-sm text-gray-500">
                    Pas encore de compte ?{' '}
                    <Link href="/auth/register" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
                        Inscrivez-vous ici
                    </Link>
                </p>
            </div>
        </div>
    )
}
