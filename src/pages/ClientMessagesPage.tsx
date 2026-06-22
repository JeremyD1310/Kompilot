import React, { useState } from 'react';
import { Page, PageHeader, PageTitle, PageBody } from '@blinkdotnew/ui';
import { ConversationList, Conversation } from '../components/messages/ConversationList';
import { ChatThread } from '../components/messages/ChatThread';

const MOCK_CONVERSATIONS: Conversation[] = [
  // ── WhatsApp conversations (new) ──
  {
    id: 'wa1',
    platform: 'whatsapp',
    name: 'Julien Bernard',
    avatar: 'J',
    preview: 'Réservation pour demain à 14h ?',
    time: '09:12',
    unread: true,
    messages: [
      { id: 'm1', from: 'client', text: 'Bonjour ! Je voulais réserver pour demain à 14h, est-ce que vous avez encore de la place ? 😊', time: '09:10' },
      { id: 'm2', from: 'client', text: 'C\'est pour 2 personnes.', time: '09:12' },
    ]
  },
  {
    id: 'wa2',
    platform: 'whatsapp',
    name: 'Amina Khalil',
    avatar: 'A',
    preview: 'Merci pour l\'offre flash reçue !',
    time: '08:45',
    unread: true,
    messages: [
      { id: 'm1', from: 'client', text: '🔥 J\'ai reçu votre offre flash. Est-ce que le code FLASH marche aussi sur les soins visage ?', time: '08:44' },
      { id: 'm2', from: 'client', text: 'Je veux réserver aujourd\'hui si possible 🙏', time: '08:45' },
    ]
  },
  {
    id: 'wa3',
    platform: 'whatsapp',
    name: 'Nicolas Petit',
    avatar: 'N',
    preview: 'Chèque cadeau pour ma femme',
    time: 'Hier',
    unread: false,
    messages: [
      { id: 'm1', from: 'client', text: 'Bonsoir, est-ce que vous proposez des chèques cadeau WhatsApp ? C\'est pour un anniversaire 🎁', time: 'Hier 18:30' },
      { id: 'm2', from: 'me', text: 'Bonsoir Nicolas ! Oui nous proposons des chèques cadeau. Commandez directement ici 👉 planity.com/votre-commerce — livraison par email immédiate ! ✨', time: 'Hier 18:45' },
      { id: 'm3', from: 'client', text: 'Super merci ! Je commande ça de suite 🙌', time: 'Hier 19:00' },
    ]
  },
  { 
    id: '1', 
    platform: 'instagram', 
    name: 'Thomas Dupont', 
    avatar: 'T', 
    preview: 'Bonjour, avez-vous des dispo samedi ?', 
    time: '14:32', 
    unread: true, 
    messages: [
      { id: 'm1', from: 'client', text: 'Bonjour ! Avez-vous des disponibilités samedi après-midi ? 😊', time: '14:30' },
      { id: 'm2', from: 'client', text: 'Je cherche un créneau pour 2 personnes.', time: '14:31' },
    ]
  },
  { 
    id: '2', 
    platform: 'instagram', 
    name: 'Sophie Martin', 
    avatar: 'S', 
    preview: 'Quel est le tarif pour un balayage ?', 
    time: '11:15', 
    unread: true, 
    messages: [
      { id: 'm1', from: 'client', text: 'Bonjour, quel est le tarif pour un balayage complet + coupe ?', time: '11:15' },
    ]
  },
  { 
    id: '3', 
    platform: 'facebook', 
    name: 'Marc Leblanc', 
    avatar: 'M', 
    preview: 'Votre restaurant est-il ouvert dimanche ?', 
    time: 'Hier', 
    unread: false, 
    messages: [
      { id: 'm1', from: 'client', text: 'Bonsoir, votre restaurant est-il ouvert ce dimanche soir ?', time: 'Hier 19:45' },
      { id: 'm2', from: 'me', text: 'Bonsoir Marc ! Oui nous sommes ouverts dimanche de 12h à 22h. Réservez ici 👉 planity.com/votre-commerce', time: 'Hier 20:02' },
    ]
  },
  { 
    id: '4', 
    platform: 'google', 
    name: 'Julie Fontaine', 
    avatar: 'J', 
    preview: 'Super restaurant, question sur la réservation', 
    time: 'Lun', 
    unread: false, 
    messages: [
      { id: 'm1', from: 'client', text: 'Bonjour ! J\'ai laissé un avis hier. Est-ce possible de réserver pour vendredi soir, 4 personnes ?', time: 'Lun 10:22' },
    ]
  },
  { 
    id: '5', 
    platform: 'facebook', 
    name: 'Pierre Arnaud', 
    avatar: 'P', 
    preview: 'Promo en ce moment ?', 
    time: 'Dim', 
    unread: true, 
    messages: [
      { id: 'm1', from: 'client', text: 'Salut, est-ce que vous avez des promos en ce moment pour les soins du visage ? 🙏', time: 'Dim 16:10' },
    ]
  },
  { 
    id: '6', 
    platform: 'instagram', 
    name: 'Camille Roux', 
    avatar: 'C', 
    preview: 'Merci pour votre réponse rapide !', 
    time: 'Sam', 
    unread: false, 
    messages: [
      { id: 'm1', from: 'client', text: 'Bonjour, est-ce que vous faites des chèques cadeaux ?', time: 'Sam 09:30' },
      { id: 'm2', from: 'me', text: 'Bonjour Camille ! Oui absolument, vous pouvez les commander en ligne ici 👉 planity.com/votre-commerce ✨', time: 'Sam 09:45' },
      { id: 'm3', from: 'client', text: 'Merci pour votre réponse rapide ! Je vais commander ça 😊', time: 'Sam 10:00' },
    ]
  },
];

export default function ClientMessagesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('Tous');

  const selectedConversation = MOCK_CONVERSATIONS.find(c => c.id === selectedId) || null;

  return (
    <Page>
      <PageHeader className="hidden">
        <PageTitle>Messages Clients</PageTitle>
      </PageHeader>
      
      <PageBody className="p-0 overflow-hidden">
        <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-border m-4 bg-background shadow-sm">
          {/* Left Panel */}
          <div className={`w-full md:w-80 shrink-0 border-r border-border h-full ${selectedId ? 'hidden md:block' : 'block'}`}>
            <ConversationList 
              conversations={MOCK_CONVERSATIONS}
              selectedId={selectedId}
              onSelect={setSelectedId}
              filter={filter}
              onFilterChange={setFilter}
            />
          </div>

          {/* Right Panel */}
          <div className={`flex-1 h-full ${!selectedId ? 'hidden md:flex' : 'flex'} flex-col`}>
            {selectedId && (
              <button 
                onClick={() => setSelectedId(null)}
                className="md:hidden p-4 text-primary font-bold flex items-center gap-2 border-b border-border bg-background"
              >
                ← Retour à la liste
              </button>
            )}
            <ChatThread conversation={selectedConversation} />
          </div>
        </div>
      </PageBody>
    </Page>
  );
}
