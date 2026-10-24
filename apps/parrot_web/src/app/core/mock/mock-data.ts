import { UserProfile } from '../models/user.model';
import { Post } from '../models/post.model';
import { EventItem } from '../models/event.model';
import { Group } from '../models/group.model';
import { Conversation } from '../models/chat.model';
import { AppNotification } from '../models/notification.model';

const person = (file: string) => `resources/person/${file}`;
const eventImg = (file: string) => `resources/event/${file}`;
const postImg = (file: string) => `resources/post/${file}`;

export const CURRENT_USER: UserProfile = {
  id: 'u-john',
  username: 'john.davis',
  email: 'john.davis@example.com',
  firstName: 'John',
  lastName: 'Davis',
  avatarUrl: person('men_1.png'),
  coverUrl: postImg('post_image_1.png'),
  bio: "Adventurer, Photographer, Optimist. Let's connect!",
  work: 'IT Programmer',
  education: 'High School',
  relationship: 'Single',
  inhabitance: 'Warsaw',
  provenance: 'Lublin',
  memberSince: '16 October 2004',
};

export const FRIENDS: UserProfile[] = [
  {
    id: 'u-jamal',
    username: 'jamal.pearson',
    email: 'jamal@example.com',
    firstName: 'Jamal',
    lastName: 'Pearson',
    avatarUrl: person('men_2.png'),
    coverUrl: postImg('post_image_2.png'),
    bio: 'Living life one trail at a time.',
    memberSince: '2 March 2019',
  },
  {
    id: 'u-solomon',
    username: 'solomon.rhodes',
    email: 'solomon@example.com',
    firstName: 'Solomon',
    lastName: 'Rhodes',
    avatarUrl: person('men_3.png'),
    coverUrl: postImg('post_image_1.png'),
    bio: 'Coffee, code, repeat.',
    memberSince: '11 July 2020',
  },
  {
    id: 'u-strong',
    username: 'john.strong',
    email: 'strong@example.com',
    firstName: 'John',
    lastName: 'Strong',
    avatarUrl: person('men_4.png'),
    coverUrl: postImg('post_image_2.png'),
    bio: 'Gym and good vibes.',
    memberSince: '5 January 2021',
  },
  {
    id: 'u-nevaeh',
    username: 'nevaeh.arias',
    email: 'nevaeh@example.com',
    firstName: 'Nevaeh',
    lastName: 'Arias',
    avatarUrl: person('women_1.png'),
    coverUrl: postImg('post_image_1.png'),
    bio: 'Here for the stories.',
    memberSince: '28 April 2018',
  },
];

export const CONTACTS: UserProfile[] = [
  {
    id: 'u-marvin',
    username: 'marvin.barlow',
    email: 'marvin@example.com',
    firstName: 'Marvin',
    lastName: 'Barlow',
    avatarUrl: person('men_2.png'),
    coverUrl: postImg('post_image_1.png'),
    bio: '',
    memberSince: '2017',
  },
  {
    id: 'u-tomas',
    username: 'tomas.gutierrez',
    email: 'tomas@example.com',
    firstName: 'Tomas',
    lastName: 'Gutierrez',
    avatarUrl: person('men_3.png'),
    coverUrl: postImg('post_image_1.png'),
    bio: '',
    memberSince: '2017',
  },
  {
    id: 'u-allan',
    username: 'allan.bullock',
    email: 'allan@example.com',
    firstName: 'Allan',
    lastName: 'Bullock',
    avatarUrl: person('men_4.png'),
    coverUrl: postImg('post_image_1.png'),
    bio: '',
    memberSince: '2017',
  },
  {
    id: 'u-zakaria',
    username: 'zakaria.mccoy',
    email: 'zakaria@example.com',
    firstName: 'Zakaria',
    lastName: 'Mccoy',
    avatarUrl: person('men_1.png'),
    coverUrl: postImg('post_image_1.png'),
    bio: '',
    memberSince: '2017',
  },
  {
    id: 'u-seamus',
    username: 'seamus.ross',
    email: 'seamus@example.com',
    firstName: 'Seamus',
    lastName: 'Ross',
    avatarUrl: person('men_2.png'),
    coverUrl: postImg('post_image_1.png'),
    bio: '',
    memberSince: '2017',
  },
];

const POST_TEXT =
  'Amidst a sprawling sea of emerald, we found solace in a warm embrace, nestled in the heart of a weed field. Surrounded by the untamed beauty of nature ...';

export const INITIAL_POSTS: Post[] = [
  {
    id: 'p1',
    authorId: CURRENT_USER.id,
    authorName: 'John Davis',
    authorAvatarUrl: CURRENT_USER.avatarUrl,
    imageUrl: postImg('post_image_1.png'),
    text: POST_TEXT,
    liked: false,
    likeCount: 47,
    upvoted: false,
    upvoteCount: 12,
    comments: [
      {
        id: 'c1',
        authorName: 'Jamal Pearson',
        authorAvatarUrl: person('men_2.png'),
        text: 'This is beautiful!',
      },
    ],
  },
  {
    id: 'p2',
    authorId: CURRENT_USER.id,
    authorName: 'John Davis',
    authorAvatarUrl: CURRENT_USER.avatarUrl,
    imageUrl: postImg('post_image_2.png'),
    text: POST_TEXT,
    liked: false,
    likeCount: 47,
    upvoted: false,
    upvoteCount: 9,
    comments: [],
  },
];

export const EVENTS: EventItem[] = [
  {
    id: 'e1',
    title: 'Charity Gala Night',
    description:
      "Join us for an elegant evening of giving, where we'll come together to raise funds for local charities. Enjoy a night of fine dining, live entertainment, and philanthropy.",
    imageUrl: eventImg('event_1.png'),
    startsAt: '2026-11-14T19:00:00.000Z',
    location: 'Grand Ballroom, Downtown Hotel',
    organizerId: 'u1',
    organizerName: 'John Davis',
    interestedCount: 3,
    interested: true,
  },
  {
    id: 'e2',
    title: 'Tech Innovators Meetup',
    description:
      'Calling all tech enthusiasts! Connect with industry leaders, share ideas, and stay ahead of the curve at our Tech Innovators Meetup. Network with ...',
    imageUrl: eventImg('event_2.png'),
    startsAt: '2026-11-20T18:00:00.000Z',
    location: 'Innovation Hub, 5th Avenue',
    organizerId: 'u2',
    organizerName: 'Allan Bullock',
    interestedCount: 3,
    interested: false,
  },
  {
    id: 'e3',
    title: 'Cultural Fusion Festival',
    description:
      'Celebrate diversity and cultural richness at our Cultural Fusion Festival. Experience a melting pot of traditions, music, dance, and cuisine from around ...',
    imageUrl: eventImg('event_3.png'),
    startsAt: '2026-12-02T12:00:00.000Z',
    location: 'Riverside Park',
    organizerId: 'u1',
    organizerName: 'John Davis',
    interestedCount: 3,
    interested: true,
  },
  {
    id: 'e4',
    title: 'Summer Music Festival',
    description:
      'A three-day celebration of live music across five stages, food trucks and art installations. Grab your friends and your dancing shoes.',
    imageUrl: eventImg('event_4.png'),
    startsAt: '2026-07-10T16:00:00.000Z',
    location: null,
    organizerId: 'u3',
    organizerName: 'Maria Lopez',
    interestedCount: 5,
    interested: false,
  },
  {
    id: 'e5',
    title: 'Underground Beats Night',
    description:
      'An intimate club night featuring up-and-coming DJs spinning house and techno until sunrise.',
    imageUrl: eventImg('event_2.png'),
    startsAt: '2026-11-28T22:00:00.000Z',
    location: 'The Basement Club',
    organizerId: 'u2',
    organizerName: 'Allan Bullock',
    interestedCount: 2,
    interested: false,
  },
  {
    id: 'e6',
    title: 'New Year Fireworks',
    description:
      'Ring in the new year with the whole city — live music, food stalls and a spectacular fireworks show at midnight.',
    imageUrl: eventImg('event_3.png'),
    startsAt: '2026-12-31T23:00:00.000Z',
    location: 'City Square',
    organizerId: 'u3',
    organizerName: 'Maria Lopez',
    interestedCount: 8,
    interested: true,
  },
];

export const GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Photography Lovers',
    description:
      'Long group description giving the group existence and pointing to what they are exsisting.',
    memberCount: 4,
    ownerId: 'u-jamal',
    ownerName: 'Jamal Pearson',
    members: [
      { id: 'u-jamal', name: 'Jamal Pearson' },
      { id: 'u-tom', name: 'Tom Scott' },
      { id: 'u-miley', name: 'Miley Marcus' },
      { id: 'u-patty', name: 'Patty Weddy' },
    ],
    joined: true,
  },
  {
    id: 'g2',
    name: 'Weekend Hikers',
    description:
      'For anyone who loves getting outdoors on the weekend — trail reports, meetups and gear talk.',
    memberCount: 3,
    ownerId: 'u-solomon',
    ownerName: 'Solomon Rhodes',
    members: [
      { id: 'u-solomon', name: 'Solomon Rhodes' },
      { id: 'u-johns', name: 'John Strong' },
      { id: 'u-nevaeh', name: 'Nevaeh Arias' },
    ],
    joined: false,
  },
];

export const GROUP_POSTS: Post[] = [
  {
    id: 'gp1',
    authorId: 'u-jamal',
    authorName: 'Jamal Pearson',
    authorAvatarUrl: person('men_2.png'),
    imageUrl: postImg('post_image_1.png'),
    text: 'Weekend shoot by the lake.',
    liked: false,
    likeCount: 12,
    upvoted: false,
    upvoteCount: 4,
    comments: [],
  },
  {
    id: 'gp2',
    authorId: 'u-strong',
    authorName: 'John Strong',
    authorAvatarUrl: person('men_4.png'),
    imageUrl: postImg('post_image_2.png'),
    text: 'Golden hour in the city.',
    liked: true,
    likeCount: 31,
    upvoted: false,
    upvoteCount: 6,
    comments: [],
  },
  {
    id: 'gp3',
    authorId: 'u-nevaeh',
    authorName: 'Nevaeh Arias',
    authorAvatarUrl: person('women_1.png'),
    text: 'Any recommendations for a budget tripod?',
    liked: false,
    likeCount: 2,
    upvoted: false,
    upvoteCount: 0,
    comments: [],
  },
  {
    id: 'gp4',
    authorId: 'u-solomon',
    authorName: 'Solomon Rhodes',
    authorAvatarUrl: person('men_3.png'),
    imageUrl: postImg('post_image_1.png'),
    text: 'Our next meetup is Saturday morning.',
    liked: false,
    likeCount: 8,
    upvoted: false,
    upvoteCount: 1,
    comments: [],
  },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-allan',
    contactId: 'u-allan',
    contactName: 'Allan Bullock',
    contactAvatarUrl: person('men_4.png'),
    messages: [
      { id: 'm1', fromMe: false, text: 'Hey! Are you joining the meetup?' },
      { id: 'm2', fromMe: true, text: 'Yes, wouldn’t miss it.' },
      { id: 'm3', fromMe: false, text: 'See you there.' },
    ],
  },
  {
    id: 'conv-marvin',
    contactId: 'u-marvin',
    contactName: 'Marvin Barlow',
    contactAvatarUrl: person('men_2.png'),
    messages: [{ id: 'm4', fromMe: false, text: 'Thanks for the photos!' }],
  },
  {
    id: 'conv-tomas',
    contactId: 'u-tomas',
    contactName: 'Tomas Gutierrez',
    contactAvatarUrl: person('men_3.png'),
    messages: [{ id: 'm5', fromMe: true, text: 'Let’s catch up this week.' }],
  },
  {
    id: 'conv-zakaria',
    contactId: 'u-zakaria',
    contactName: 'Zakaria Mccoy',
    contactAvatarUrl: person('men_1.png'),
    messages: [],
  },
  {
    id: 'conv-seamus',
    contactId: 'u-seamus',
    contactName: 'Seamus Ross',
    contactAvatarUrl: person('men_2.png'),
    messages: [],
  },
];

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'post-like',
    icon: 'favorite',
    text: 'Jamal Pearson liked your post.',
    timeAgo: '5m',
    read: false,
  },
  {
    id: 'n2',
    type: 'post-comment',
    icon: 'chat_bubble',
    text: 'Solomon Rhodes commented on your post.',
    timeAgo: '1h',
    read: false,
  },
  {
    id: 'n3',
    type: 'event-reminder',
    icon: 'event',
    text: 'Charity Gala Night is starting soon.',
    timeAgo: '3h',
    read: true,
  },
  {
    id: 'n4',
    type: 'group-invite',
    icon: 'group',
    text: 'You were added to Photography Lovers.',
    timeAgo: '1d',
    read: true,
  },
  {
    id: 'n5',
    type: 'friend-request',
    icon: 'person_add',
    text: 'Nevaeh Arias sent you a friend request.',
    timeAgo: '2d',
    read: true,
  },
];
