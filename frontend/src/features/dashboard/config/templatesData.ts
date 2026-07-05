import { Sparkles, Calendar, ArrowUpRight, MessageSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface FlowTemplate {
  id: string;
  title: string;
  shortDesc: string;
  icon: LucideIcon;
  iconBgClass: string;
  iconTextClass: string;
  hoverTextClass: string;
  type: string;
  category: string;
  goal: 'engage' | 'traffic' | 'all';
  trigger: 'dm' | 'all';
  businessValue: string;
  howItWorks: string;
  phonePreview: {
    avatarText: string;
    avatarBg: string;
    senderName: string;
    messages: {
      id: string;
      text: string;
      imageUrl?: string;
      isUser?: boolean;
    }[];
  };
  nodes: any[];
  edges: any[];
}

export const TEMPLATES_DATA: FlowTemplate[] = [
  {
    id: 'lead_magnet',
    title: 'Capture customer contact information with an automated Lead Magnet',
    shortDesc: 'Build your customer email list automatically by offering valuable resources directly inside Telegram. Send files, ebooks, or guides instantly after getting user contact information.',
    icon: Sparkles,
    iconBgClass: 'bg-indigo-50 border-indigo-100',
    iconTextClass: 'text-indigo-600',
    hoverTextClass: 'group-hover:text-indigo-600',
    type: 'Flow Builder',
    category: 'Recommended',
    goal: 'engage',
    trigger: 'dm',
    businessValue: 'Grow your customer database and build trust instantly. Converts high-intent chat inquiries into email contacts without requiring external landing pages, sign-up forms, or complex funnels.',
    howItWorks: 'Starts automatically when a user clicks your link or sends a specific keyword. It greets them, requests their email address, and instantly delivers the download link once they reply.',
    phonePreview: {
      avatarText: 'LM',
      avatarBg: 'bg-indigo-500',
      senderName: 'Lead Magnet Bot',
      messages: [
        {
          id: 'p1',
          text: 'Thank you for your interest. Please enter your email below to get the download link:'
        },
        {
          id: 'p2',
          text: 'Thanks! Here is your download link:\n\nhttps://example.com/ebook.pdf'
        }
      ]
    },
    nodes: [
      {
        id: 'node_start',
        type: 'START',
        position: { x: 240, y: 150 },
        data: { triggerKeyword: 'ebook' }
      },
      {
        id: 'node_comment_start',
        type: 'COMMENT',
        position: { x: 240, y: -20 },
        data: {
          text: 'Trigger: Activated when a user starts a conversation using a link or by sending a keyword.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_comment_middle',
        type: 'COMMENT',
        position: { x: 580, y: -20 },
        data: {
          text: 'Data Collection: This block requests the email address and halts the flow until a valid email is typed by the user.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_comment_end',
        type: 'COMMENT',
        position: { x: 920, y: -20 },
        data: {
          text: 'Delivery: Once the email is saved, this message delivers the resource via a URL link button.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_message_1',
        type: 'MESSAGE',
        position: { x: 580, y: 150 },
        data: {
          blocks: [
            {
              id: 'block_text_1',
              type: 'text',
              text: 'Thank you for your interest. Please enter your email below to get the download link:'
            },
            {
              id: 'block_dc_1',
              type: 'data_collection',
              text: 'Enter your email:',
              variableName: 'email',
              replyType: 'Email'
            }
          ]
        }
      },
      {
        id: 'node_message_2',
        type: 'MESSAGE',
        position: { x: 920, y: 150 },
        data: {
          blocks: [
            {
              id: 'block_text_2',
              type: 'text',
              text: 'Thanks! Here is your download link:',
              buttons: [
                {
                  label: 'Download PDF',
                  value: 'btn_download',
                  actionType: 'URL',
                  actionTarget: 'https://example.com/ebook.pdf'
                }
              ]
            }
          ]
        }
      }
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'node_start',
        target: 'node_message_1',
        sourceHandle: 'then'
      },
      {
        id: 'edge_2',
        source: 'node_message_1',
        target: 'node_message_2',
        sourceHandle: 'reply'
      }
    ]
  },
  {
    id: 'qualify_leads',
    title: 'Qualify prospects and segment your audience with a Lead Quiz',
    shortDesc: 'Ask interactive multiple-choice questions to filter high-value leads and automatically direct them to different sales paths based on their preferences.',
    icon: MessageSquare,
    iconBgClass: 'bg-emerald-50 border-emerald-100',
    iconTextClass: 'text-emerald-600',
    hoverTextClass: 'group-hover:text-emerald-600',
    type: 'Flow Builder',
    category: 'Recommended',
    goal: 'engage',
    trigger: 'all',
    businessValue: 'Saves time for your sales team by pre-qualifying prospects. Groups users into segments automatically and delivers personalized product recommendations instantly.',
    howItWorks: 'Asks a question with inline buttons. When a user selects an answer, the flow branches and routes them to different message blocks with custom checklists or resources.',
    phonePreview: {
      avatarText: 'QS',
      avatarBg: 'bg-emerald-500',
      senderName: 'Quiz Master',
      messages: [
        {
          id: 'p1',
          text: 'What is your primary business goal right now?\n\n[ Drive traffic ]  [ Capture leads ]'
        },
        {
          id: 'p2',
          text: 'Great choice. Here is a guide to increase your website traffic:\n\nhttps://example.com/traffic-guide'
        }
      ]
    },
    nodes: [
      {
        id: 'node_start',
        type: 'START',
        position: { x: 100, y: 250 },
        data: { triggerKeyword: 'quiz' }
      },
      {
        id: 'node_comment_start',
        type: 'COMMENT',
        position: { x: 100, y: 80 },
        data: {
          text: 'Trigger: Initiated when a user subscribes. It prompts them with a qualification question.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_comment_branch',
        type: 'COMMENT',
        position: { x: 450, y: 50 },
        data: {
          text: 'Branching: The user selects their goal using inline buttons. This routes them down distinct paths.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_comment_traffic',
        type: 'COMMENT',
        position: { x: 800, y: -20 },
        data: {
          text: 'Traffic Segment: Users wanting traffic receive the targeted traffic generation guide.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_comment_leads',
        type: 'COMMENT',
        position: { x: 800, y: 540 },
        data: {
          text: 'Leads Segment: Users wanting leads receive the funnel checklist.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_message_1',
        type: 'MESSAGE',
        position: { x: 450, y: 250 },
        data: {
          blocks: [
            {
              id: 'block_text_1',
              type: 'text',
              text: 'What is your primary business goal right now?',
              buttons: [
                {
                  label: 'Drive traffic',
                  value: 'btn_traffic',
                  actionType: 'NODE',
                  actionTarget: 'node_traffic'
                },
                {
                  label: 'Capture leads',
                  value: 'btn_leads',
                  actionType: 'NODE',
                  actionTarget: 'node_leads'
                }
              ]
            }
          ]
        }
      },
      {
        id: 'node_traffic',
        type: 'MESSAGE',
        position: { x: 800, y: 120 },
        data: {
          blocks: [
            {
              id: 'block_text_2',
              type: 'text',
              text: 'Great choice. Here is a guide to increase your website traffic:',
              buttons: [
                {
                  label: 'Read Guide',
                  value: 'btn_traffic_link',
                  actionType: 'URL',
                  actionTarget: 'https://example.com/traffic-guide'
                }
              ]
            }
          ]
        }
      },
      {
        id: 'node_leads',
        type: 'MESSAGE',
        position: { x: 800, y: 400 },
        data: {
          blocks: [
            {
              id: 'block_text_3',
              type: 'text',
              text: 'Perfect. Here is our checklist to set up a lead generation funnel:',
              buttons: [
                {
                  label: 'Get Checklist',
                  value: 'btn_leads_link',
                  actionType: 'URL',
                  actionTarget: 'https://example.com/checklist'
                }
              ]
            }
          ]
        }
      }
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'node_start',
        target: 'node_message_1',
        sourceHandle: 'then'
      },
      {
        id: 'edge_traffic',
        source: 'node_message_1',
        target: 'node_traffic',
        sourceHandle: 'btn_traffic'
      },
      {
        id: 'edge_leads',
        source: 'node_message_1',
        target: 'node_leads',
        sourceHandle: 'btn_leads'
      }
    ]
  },
  {
    id: 'redirect_website',
    title: 'Direct customers to your store or support using Telegram Menu Buttons',
    shortDesc: 'Provide a quick-access interactive menu at the bottom of the chat to guide users directly to your products catalog, online store, or support portal.',
    icon: ArrowUpRight,
    iconBgClass: 'bg-blue-50 border-blue-100',
    iconTextClass: 'text-blue-600',
    hoverTextClass: 'group-hover:text-blue-600',
    type: 'Flow Builder',
    category: 'Discover',
    goal: 'traffic',
    trigger: 'all',
    businessValue: 'Improves site traffic and simplifies customer navigation. Allows users to discover your store categories and support links in a single click.',
    howItWorks: 'Greets users with a message accompanied by bottom menu reply buttons. Based on the selected menu option, it sends a targeted link to browse products or reach support.',
    phonePreview: {
      avatarText: 'WS',
      avatarBg: 'bg-blue-500',
      senderName: 'Web Router',
      messages: [
        {
          id: 'p1',
          text: 'Welcome! Select a category below to browse our online store:\n\n[ View Products ]  [ Contact Support ]'
        },
        {
          id: 'p2',
          text: 'Here is our catalog. Click the link to view products:\n\nhttps://example.com/catalog'
        }
      ]
    },
    nodes: [
      {
        id: 'node_start',
        type: 'START',
        position: { x: 100, y: 250 },
        data: { triggerKeyword: 'website' }
      },
      {
        id: 'node_comment_start',
        type: 'COMMENT',
        position: { x: 100, y: 80 },
        data: {
          text: 'Trigger: Starts when a user opens the chat. It displays the main menu options.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_comment_menu',
        type: 'COMMENT',
        position: { x: 450, y: 50 },
        data: {
          text: 'Menu Options: Users select from bottom reply buttons to visit products or support.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_comment_products',
        type: 'COMMENT',
        position: { x: 800, y: -20 },
        data: {
          text: 'Products Path: Directs customers to open the online store catalog.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_comment_support',
        type: 'COMMENT',
        position: { x: 800, y: 540 },
        data: {
          text: 'Support Path: Guides users to open the ticketing portal or reach support.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_message_1',
        type: 'MESSAGE',
        position: { x: 450, y: 250 },
        data: {
          blocks: [
            {
              id: 'block_text_1',
              type: 'text',
              text: 'Welcome! Select a category below to browse our online store:'
            },
            {
              id: 'block_menu_1',
              type: 'telegram_menu',
              buttons: [
                {
                  label: 'View Products',
                  value: 'menu_products',
                  actionType: 'NODE',
                  actionTarget: 'node_products',
                  row: '0'
                },
                {
                  label: 'Contact Support',
                  value: 'menu_support',
                  actionType: 'NODE',
                  actionTarget: 'node_support',
                  row: '0'
                }
              ]
            }
          ]
        }
      },
      {
        id: 'node_products',
        type: 'MESSAGE',
        position: { x: 800, y: 120 },
        data: {
          blocks: [
            {
              id: 'block_text_2',
              type: 'text',
              text: 'Here is our catalog. Click the link to view products:',
              buttons: [
                {
                  label: 'Open Catalog',
                  value: 'btn_cat_link',
                  actionType: 'URL',
                  actionTarget: 'https://example.com/catalog'
                }
              ]
            }
          ]
        }
      },
      {
        id: 'node_support',
        type: 'MESSAGE',
        position: { x: 800, y: 400 },
        data: {
          blocks: [
            {
              id: 'block_text_3',
              type: 'text',
              text: 'Need help? Visit our support portal or start a live chat:',
              buttons: [
                {
                  label: 'Support Portal',
                  value: 'btn_sup_link',
                  actionType: 'URL',
                  actionTarget: 'https://example.com/support'
                }
              ]
            }
          ]
        }
      }
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'node_start',
        target: 'node_message_1',
        sourceHandle: 'then'
      },
      {
        id: 'edge_products',
        source: 'node_message_1',
        target: 'node_products',
        sourceHandle: 'menu_products'
      },
      {
        id: 'edge_support',
        source: 'node_message_1',
        target: 'node_support',
        sourceHandle: 'menu_support'
      }
    ]
  },
  {
    id: 'event_reminders',
    title: 'Send automated event reminders and webinar follow-ups',
    shortDesc: 'Keep your registered attendees engaged by scheduling automated confirmation messages, daily reminders, and event joining links.',
    icon: Calendar,
    iconBgClass: 'bg-rose-50 border-rose-100',
    iconTextClass: 'text-rose-600',
    hoverTextClass: 'group-hover:text-rose-600',
    type: 'Flow Builder',
    category: 'Discover',
    goal: 'all',
    trigger: 'all',
    businessValue: 'Drastically improves event show-up rates and webinars attendance. Keeps your brand fresh in the user\'s mind and automates the entire follow-up workflow.',
    howItWorks: 'Confirms registration, waits for a specified delay using a smart delay block, and sends a reminder message containing the direct link to join the event.',
    phonePreview: {
      avatarText: 'EV',
      avatarBg: 'bg-rose-500',
      senderName: 'Event Bot',
      messages: [
        {
          id: 'p1',
          text: 'Thank you for registering. We will notify you before the webinar starts.'
        },
        {
          id: 'p2',
          text: 'Webinar starts in 1 hour. Use the link below to join:\n\nhttps://example.com/join'
        }
      ]
    },
    nodes: [
      {
        id: 'node_start',
        type: 'START',
        position: { x: 100, y: 220 },
        data: { triggerKeyword: 'register' }
      },
      {
        id: 'node_comment_start',
        type: 'COMMENT',
        position: { x: 100, y: 50 },
        data: {
          text: 'Trigger: Fired when a registration keyword is received. Confirms attendance.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_comment_delay',
        type: 'COMMENT',
        position: { x: 800, y: 50 },
        data: {
          text: 'Delay Block: Halts execution for a specified duration before executing follow-up messages.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_comment_reminder',
        type: 'COMMENT',
        position: { x: 1100, y: 50 },
        data: {
          text: 'Follow-up: Sends a reminder containing the joining link shortly before event kickoff.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_message_1',
        type: 'MESSAGE',
        position: { x: 450, y: 220 },
        data: {
          blocks: [
            {
              id: 'block_text_1',
              type: 'text',
              text: 'Thank you for registering. We will notify you before the webinar starts.'
            }
          ]
        }
      },
      {
        id: 'node_delay',
        type: 'SMART_DELAY',
        position: { x: 800, y: 220 },
        data: {
          delayValue: 1,
          delayUnit: 'hours'
        }
      },
      {
        id: 'node_message_2',
        type: 'MESSAGE',
        position: { x: 1100, y: 220 },
        data: {
          blocks: [
            {
              id: 'block_text_2',
              type: 'text',
              text: 'Webinar starts in 1 hour. Use the link below to join:',
              buttons: [
                {
                  label: 'Join Webinar',
                  value: 'btn_join',
                  actionType: 'URL',
                  actionTarget: 'https://example.com/join'
                }
              ]
            }
          ]
        }
      }
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'node_start',
        target: 'node_message_1',
        sourceHandle: 'then'
      },
      {
        id: 'edge_delay',
        source: 'node_message_1',
        target: 'node_delay',
        sourceHandle: 'next'
      },
      {
        id: 'edge_message_2',
        source: 'node_delay',
        target: 'node_message_2',
        sourceHandle: 'next'
      }
    ]
  },
  {
    id: 'ab_test_promo',
    title: 'Run A/B testing for promotional offers using a Randomizer',
    shortDesc: 'Split your traffic automatically between two promotional messages to measure which offer performs better.',
    icon: Sparkles,
    iconBgClass: 'bg-indigo-50 border-indigo-100',
    iconTextClass: 'text-indigo-600',
    hoverTextClass: 'group-hover:text-indigo-600',
    type: 'Flow Builder',
    category: 'Discover',
    goal: 'traffic',
    trigger: 'all',
    businessValue: 'Optimizes your sales funnel by identifying the highest-converting offer. Allows data-backed marketing decisions directly inside Telegram.',
    howItWorks: 'A randomizer splits incoming users fifty-fifty. Half get Offer A (discount link), and the other half get Offer B (free shipping link).',
    phonePreview: {
      avatarText: 'AB',
      avatarBg: 'bg-indigo-500',
      senderName: 'Promo Tester',
      messages: [
        {
          id: 'p1',
          text: 'Welcome! We have a special offer for you today.'
        },
        {
          id: 'p2',
          text: 'Option A: Get a 20 percent discount on your first order:\n\nhttps://example.com/discount'
        }
      ]
    },
    nodes: [
      {
        id: 'node_start',
        type: 'START',
        position: { x: 100, y: 250 },
        data: { triggerKeyword: 'promo' }
      },
      {
        id: 'node_comment_start',
        type: 'COMMENT',
        position: { x: 100, y: 80 },
        data: {
          text: 'Trigger: Activated when a user starts the conversation. Leads them to the A/B split.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_comment_split',
        type: 'COMMENT',
        position: { x: 450, y: 50 },
        data: {
          text: 'Randomizer: Automatically splits traffic into two equal variations (50% and 50%) to test different offers.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_comment_opt_a',
        type: 'COMMENT',
        position: { x: 800, y: -20 },
        data: {
          text: 'Variation A: Sends the user a twenty percent discount URL link.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_comment_opt_b',
        type: 'COMMENT',
        position: { x: 800, y: 540 },
        data: {
          text: 'Variation B: Sends the user a free shipping URL link.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_random',
        type: 'RANDOMIZER',
        position: { x: 450, y: 250 },
        data: {
          variations: [
            { id: 'variation_0', label: 'Variation A', percentage: 50, color: '#7C3AED' },
            { id: 'variation_1', label: 'Variation B', percentage: 50, color: '#B45309' }
          ]
        }
      },
      {
        id: 'node_opt_a',
        type: 'MESSAGE',
        position: { x: 800, y: 120 },
        data: {
          blocks: [
            {
              id: 'block_text_opt_a',
              type: 'text',
              text: 'Here is a special offer. Get a 20 percent discount on your first order:',
              buttons: [
                {
                  label: 'Get 20% Off',
                  value: 'btn_opt_a',
                  actionType: 'URL',
                  actionTarget: 'https://example.com/discount'
                }
              ]
            }
          ]
        }
      },
      {
        id: 'node_opt_b',
        type: 'MESSAGE',
        position: { x: 800, y: 400 },
        data: {
          blocks: [
            {
              id: 'block_text_opt_b',
              type: 'text',
              text: 'Here is a special offer. Get free shipping on your first order:',
              buttons: [
                {
                  label: 'Get Free Shipping',
                  value: 'btn_opt_b',
                  actionType: 'URL',
                  actionTarget: 'https://example.com/free-shipping'
                }
              ]
            }
          ]
        }
      }
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'node_start',
        target: 'node_random',
        sourceHandle: 'then'
      },
      {
        id: 'edge_random_a',
        source: 'node_random',
        target: 'node_opt_a',
        sourceHandle: 'variation_0'
      },
      {
        id: 'edge_random_b',
        source: 'node_random',
        target: 'node_opt_b',
        sourceHandle: 'variation_1'
      }
    ]
  },
  {
    id: 'vip_routing',
    title: 'Route customers dynamically based on VIP membership status',
    shortDesc: 'Use a Condition block to verify if a user has a VIP tag, routing them to priority support or a standard agent.',
    icon: MessageSquare,
    iconBgClass: 'bg-emerald-50 border-emerald-100',
    iconTextClass: 'text-emerald-600',
    hoverTextClass: 'group-hover:text-emerald-600',
    type: 'Flow Builder',
    category: 'Discover',
    goal: 'engage',
    trigger: 'all',
    businessValue: 'Ensures premium service for high-value clients while managing agent workload efficiently. Boosts retention and support satisfaction.',
    howItWorks: 'Checks if the customer matches the VIP tag condition. If yes, it connects them to a premium agent; otherwise, it sends them to standard support.',
    phonePreview: {
      avatarText: 'VR',
      avatarBg: 'bg-emerald-500',
      senderName: 'VIP Router',
      messages: [
        {
          id: 'p1',
          text: 'Checking your customer status...'
        },
        {
          id: 'p2',
          text: 'Welcome VIP member. Routing you to our priority support desk now.'
        }
      ]
    },
    nodes: [
      {
        id: 'node_start',
        type: 'START',
        position: { x: 100, y: 250 },
        data: { triggerKeyword: 'support' }
      },
      {
        id: 'node_comment_start',
        type: 'COMMENT',
        position: { x: 100, y: 80 },
        data: {
          text: 'Trigger: Begins when the user requests live support.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_comment_cond',
        type: 'COMMENT',
        position: { x: 450, y: 50 },
        data: {
          text: 'Condition Check: Checks if the user is tagged as VIP. Routes them based on result.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_comment_vip',
        type: 'COMMENT',
        position: { x: 800, y: -20 },
        data: {
          text: 'VIP Path: User is confirmed as VIP. Sends priority support access link.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_comment_std',
        type: 'COMMENT',
        position: { x: 800, y: 540 },
        data: {
          text: 'Standard Path: User is standard. Directs them to the self-service helpdesk.',
          noteSize: 'M',
          fontSize: 'S'
        }
      },
      {
        id: 'node_cond',
        type: 'CONDITION',
        position: { x: 450, y: 250 },
        data: {
          variableName: 'VIP_Member',
          operator: 'EQUALS',
          value: 'true'
        }
      },
      {
        id: 'node_vip',
        type: 'MESSAGE',
        position: { x: 800, y: 120 },
        data: {
          blocks: [
            {
              id: 'block_text_vip',
              type: 'text',
              text: 'Welcome VIP member. Routing you to our priority support desk:',
              buttons: [
                {
                  label: 'Priority Desk',
                  value: 'btn_vip_link',
                  actionType: 'URL',
                  actionTarget: 'https://example.com/vip-desk'
                }
              ]
            }
          ]
        }
      },
      {
        id: 'node_std',
        type: 'MESSAGE',
        position: { x: 800, y: 400 },
        data: {
          blocks: [
            {
              id: 'block_text_std',
              type: 'text',
              text: 'Welcome. Please visit our helpdesk to find answers or open a support ticket:',
              buttons: [
                {
                  label: 'Open Helpdesk',
                  value: 'btn_std_link',
                  actionType: 'URL',
                  actionTarget: 'https://example.com/helpdesk'
                }
              ]
            }
          ]
        }
      }
    ],
    edges: [
      {
        id: 'edge_1',
        source: 'node_start',
        target: 'node_cond',
        sourceHandle: 'then'
      },
      {
        id: 'edge_cond_vip',
        source: 'node_cond',
        target: 'node_vip',
        sourceHandle: 'branch_0'
      },
      {
        id: 'edge_cond_std',
        source: 'node_cond',
        target: 'node_std',
        sourceHandle: 'fallback'
      }
    ]
  }
];
