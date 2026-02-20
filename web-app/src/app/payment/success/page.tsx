import Link from 'next/link';

export default function PaymentSuccessPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-green-50">
            <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">✅</span>
                </div>
                <h1 className="text-3xl font-bold text-green-800 mb-2">Paiement Réussi !</h1>
                <p className="text-green-600 mb-8">Merci pour votre cotisation. Votre compte est à jour.</p>

                <Link
                    href="/feed"
                    className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors"
                >
                    Aller au Fil d'actualité
                </Link>
            </div>
        </div>
    );
}
