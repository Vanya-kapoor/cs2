import { User, Question, Notification } from '../types';

export const mockUsers: Record<string, User> = {
  u1: {
    id: 'u1',
    name: 'Guneet Toppo',
    role: 'INTERN',
    avatar: '🍒',
    stats: {
      questionsAsked: 4,
      answersPosted: 2,
      upvotesReceived: 18,
      reputation: 120,
    },
    badges: ['First Question', 'Helpful Contributor'],
  },
  u2: {
    id: 'u2',
    name: 'Sarah Connor',
    role: 'ADMIN',
    avatar: '🦊',
    stats: {
      questionsAsked: 1,
      answersPosted: 45,
      upvotesReceived: 320,
      reputation: 980,
    },
    badges: ['Top Intern', 'FAQ Expert', 'Official Mentor'],
  },
  u3: {
    id: 'u3',
    name: 'David Chen',
    role: 'MENTOR',
    avatar: '🐼',
    stats: {
      questionsAsked: 0,
      answersPosted: 22,
      upvotesReceived: 142,
      reputation: 510,
    },
    badges: ['Helpful Contributor', 'FAQ Expert'],
  },
  u4: {
    id: 'u4',
    name: 'Aisha Rahman',
    role: 'INTERN',
    avatar: '🦄',
    stats: {
      questionsAsked: 3,
      answersPosted: 5,
      upvotesReceived: 29,
      reputation: 190,
    },
    badges: ['First Question'],
  }
};

export const initialQuestions: Question[] = [
  {
    id: 'q1',
    title: 'When is the monthly stipend disbursed for engineering interns?',
    description: 'I started my internship on the 1st of this month and haven\'t received any updates regarding the stipend timeline. Who should I contact?',
    category: 'Stipend',
    tags: ['stipend', 'finance', 'payout'],
    upvotes: 24,
    views: 142,
    isOfficial: true,
    isAccepted: true,
    status: 'RESOLVED',
    followers: 12,
    needsAttention: false,
    createdAt: '2026-05-15T10:00:00.000Z',
    author: mockUsers.u1,
    upvotedBy: ['u2', 'u3', 'u4'],
    bookmarkedBy: ['u1', 'u3'],
    followedBy: ['u1', 'u4'],
    answers: [
      {
        id: 'a1_1',
        questionId: 'q1',
        author: mockUsers.u2,
        content: 'Stipends are officially processed on the 28th of every month. If the 28th falls on a weekend, it is processed on the preceding Friday. You will receive an automated email from the payroll portal (SalaryHub) once it is credited.',
        upvotes: 18,
        isOfficial: true,
        isAccepted: true,
        createdAt: '2026-05-15T11:30:00.000Z'
      },
      {
        id: 'a1_2',
        questionId: 'q1',
        author: mockUsers.u4,
        content: 'Mine came exactly on the 28th last month! Make sure your bank details are fully verified in the onboarding dashboard (Form 16/PAN details).',
        upvotes: 4,
        isOfficial: false,
        isAccepted: false,
        createdAt: '2026-05-15T12:00:00.000Z'
      }
    ]
  },
  {
    id: 'q2',
    title: 'What are the performance criteria for a Pre-Placement Offer (PPO)?',
    description: 'I want to know how interns are evaluated for full-time conversion. Is there a formal review structure, or is it based entirely on the manager\'s recommendation?',
    category: 'PPO',
    tags: ['ppo', 'conversion', 'career', 'evaluation'],
    upvotes: 38,
    views: 290,
    isOfficial: true,
    isAccepted: false,
    status: 'UNDER_REVIEW',
    followers: 43,
    needsAttention: true,
    createdAt: '2026-05-18T09:15:00.000Z',
    author: mockUsers.u4,
    upvotedBy: ['u1', 'u2', 'u3'],
    bookmarkedBy: ['u1', 'u2'],
    followedBy: ['u1', 'u2', 'u3', 'u4'],
    answers: [
      {
        id: 'a2_1',
        questionId: 'q2',
        author: mockUsers.u3,
        content: 'The conversion process is based on three main pillars: (1) Successful mid-term and final project presentations, (2) Coding/design standards checked by a senior bar-raiser, and (3) Direct feedback from your manager regarding ownership and communication. Review committees meet during week 8 to make recommendations.',
        upvotes: 15,
        isOfficial: true,
        isAccepted: false,
        createdAt: '2026-05-18T10:45:00.000Z'
      }
    ]
  },
  {
    id: 'q3',
    title: 'How do I request a change in my project/team assignment?',
    description: 'I was assigned to a legacy maintenance project, but my skills are heavily in machine learning. I would love to transition to the AI research team. Is this allowed?',
    category: 'Projects',
    tags: ['projects', 'team-change', 'mentor', 'skills'],
    upvotes: 9,
    views: 54,
    isOfficial: false,
    isAccepted: false,
    status: 'ESCALATED',
    followers: 6,
    needsAttention: true,
    createdAt: '2026-05-24T14:20:00.000Z',
    author: mockUsers.u1,
    upvotedBy: ['u4'],
    bookmarkedBy: [],
    followedBy: ['u1'],
    answers: []
  },
  {
    id: 'q4',
    title: 'What documents are required for background verification (BGV) during joining?',
    description: 'I received the offer letter but haven\'t gotten the BGV portal link yet. Can someone list down the standard checklist of documents required?',
    category: 'Joining Formalities',
    tags: ['bgv', 'onboarding', 'joining', 'documents'],
    upvotes: 19,
    views: 110,
    isOfficial: true,
    isAccepted: true,
    status: 'RESOLVED',
    followers: 8,
    needsAttention: false,
    createdAt: '2026-05-20T08:30:00.000Z',
    author: mockUsers.u4,
    upvotedBy: ['u1', 'u2'],
    bookmarkedBy: ['u4'],
    followedBy: [],
    answers: [
      {
        id: 'a4_1',
        questionId: 'q4',
        author: mockUsers.u2,
        content: 'You will need: (1) Final semester marksheet or provisional degree, (2) Previous internship certificates (if applicable), (3) Valid ID (Aadhaar/PAN), and (4) Permanent address proof. The BGV portal link is sent exactly 14 days before your joining date. Don\'t panic if you haven\'t received it yet!',
        upvotes: 21,
        isOfficial: true,
        isAccepted: true,
        createdAt: '2026-05-20T09:00:00.000Z'
      }
    ]
  },
  {
    id: 'q5',
    title: 'Is there a hybrid work policy or is it fully in-office for interns?',
    description: 'My letter says "On-site," but some seniors mentioned that team managers can approve hybrid/WFH arrangements. What is the official stance?',
    category: 'Company Policies',
    tags: ['work-policy', 'wfh', 'hybrid', 'office'],
    upvotes: 15,
    views: 89,
    isOfficial: false,
    isAccepted: false,
    status: 'OPEN',
    followers: 3,
    needsAttention: true,
    createdAt: '2026-05-26T16:40:00.000Z',
    author: mockUsers.u1,
    upvotedBy: [],
    bookmarkedBy: [],
    followedBy: ['u1'],
    answers: []
  }
];

export const initialNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'ANSWER_RECEIVED',
    title: 'New Answer Received!',
    content: 'Sarah Connor (Admin) posted an answer to your question about stipend timelines.',
    createdAt: '2026-05-29T11:00:00.000Z',
    read: false,
    questionId: 'q1'
  },
  {
    id: 'n2',
    type: 'ANSWER_ACCEPTED',
    title: 'Answer Accepted!',
    content: 'Your answer to "What documents are required for BGV?" was accepted by Aisha Rahman.',
    createdAt: '2026-05-29T10:30:00.000Z',
    read: false,
    questionId: 'q4'
  },
  {
    id: 'n3',
    type: 'ESCALATED',
    title: 'Question Escalated',
    content: 'Your question "How do I request a team change?" has been escalated to HR Admin.',
    createdAt: '2026-05-28T15:20:00.000Z',
    read: true,
    questionId: 'q3'
  },
  {
    id: 'n4',
    type: 'OFFICIAL_ANSWER',
    title: 'Official Answer Posted',
    content: 'David Chen (Mentor) posted an official answer on PPO criteria.',
    createdAt: '2026-05-28T12:00:00.000Z',
    read: true,
    questionId: 'q2'
  }
];
