export type ThemeName = 'neutral' | 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'rose'

interface ThemeColors {
  primary: {
    light: string
    DEFAULT: string
    dark: string
  }
  text: {
    primary: string
    primaryHover: string
    secondary: string
    secondaryHover: string
    muted: string
    mutedHover: string
    error: string
  }
  bg: {
    primary: string
    primaryHover: string
    secondary: string
    secondaryHover: string
    light: string
    lightHover: string
    medium: string
    mediumHover: string
    card: string
    cardHover: string
  }
  border: {
    primary: string
    ring: string
    input: string
    default: string
  }
  like: {
    active: string
    activeHover: string
    inactive: string
    hover: string
    activeClick: string
  }
  favorite: {
    active: string
    activeHover: string
    inactive: string
    hover: string
    activeClick: string
  }
  comment: {
    like: {
      active: string
      activeHover: string
      inactive: string
      hover: string
    }
    icon: {
      DEFAULT: string
      hover: string
    }
  }
  link: {
    DEFAULT: string
    hover: string
  }
  tag: {
    bg: string
    text: string
    hover: string
  }
  button: {
    primary: string
    secondary: string
    disabled: string
    ghost: string
    outline: string
  }
  info: {
    bg: string
    text: string
    border: string
  }
  loader: string
  heat: {
    bg: string
    text: string
  }
  share: {
    DEFAULT: string
    hover: string
    active: string
  }
  report: {
    DEFAULT: string
    hover: string
    active: string
  }
  details: {
    DEFAULT: string
    hover: string
    active: string
  }
  evolution: {
    DEFAULT: string
    hover: string
    active: string
  }
  menu: {
    item: string
    itemHover: string
    active: string
    activeHover: string
  }
  modal: {
    overlay: string
    bg: string
    border: string
  }
}

interface ThemeConfig {
  name: ThemeName
  label: string
  previewColor: string
  colors: ThemeColors
}

interface ThemeClassNames {
  title: string
  likeButton: (isActive: boolean) => string
  favoriteButton: (isActive: boolean) => string
  commentLikeButton: (isActive: boolean) => string
  shareButton: string
  reportButton: string
  detailsButton: string
  evolutionButton: string
  disabledButton: string
  primaryButton: string
  secondaryButton: string
  tag: string
  heat: string
  loader: string
  colors: ThemeColors
  modalOverlay: string
  modalBg: string
  modalBorder: string
  focusRing: string
  input: string
  link: string
  successMessage: string
  selected: string
  timelineLine: string
  timelineDot: string
  timelineContent: string
  storyBox: string
  storyTitle: string
  errorMessage: string
  inputError: string
  menuItem: string
}

export const themes: Record<ThemeName, ThemeConfig> = {
  neutral: {
    name: 'neutral',
    label: 'Professional Gray',
    previewColor: '#6b7280',
    colors: {
      primary: {
        light: 'gray-300',
        DEFAULT: 'gray-500',
        dark: 'gray-600',
      },
      text: {
        primary: 'text-gray-700',
        primaryHover: 'hover:text-gray-500',
        secondary: 'text-gray-600',
        secondaryHover: 'hover:text-gray-500',
        muted: 'text-gray-500',
        mutedHover: 'hover:text-gray-600',
        error: 'text-red-600',
      },
      bg: {
        primary: 'bg-gray-500',
        primaryHover: 'hover:bg-gray-600',
        secondary: 'bg-gray-400',
        secondaryHover: 'hover:bg-gray-500',
        light: 'bg-gray-50',
        lightHover: 'hover:bg-gray-100',
        medium: 'bg-gray-100',
        mediumHover: 'hover:bg-gray-200',
        card: 'bg-white',
        cardHover: 'hover:shadow-md hover:bg-gray-50',
      },
      border: {
        primary: 'border-gray-300',
        ring: 'focus:ring-gray-200',
        input: 'border-gray-300',
        default: 'border-gray-200',
      },
      like: {
        active: 'bg-gray-100 text-gray-700',
        activeHover: 'hover:bg-gray-200 hover:text-gray-800',
        inactive: 'bg-gray-100 text-gray-600',
        hover: 'hover:bg-gray-50 hover:text-gray-600',
        activeClick: 'active:scale-95 active:bg-gray-200 transition-transform',
      },
      favorite: {
        active: 'bg-yellow-100 text-yellow-700',
        activeHover: 'hover:bg-yellow-200 hover:text-yellow-800',
        inactive: 'bg-gray-100 text-gray-600',
        hover: 'hover:bg-yellow-50 hover:text-yellow-600',
        activeClick: 'active:scale-95 active:bg-yellow-200 transition-transform',
      },
      comment: {
        like: {
          active: 'bg-gray-100 text-gray-700',
          activeHover: 'hover:bg-gray-200 hover:text-gray-800',
          inactive: 'bg-gray-100 text-gray-600',
          hover: 'hover:bg-gray-50 hover:text-gray-600',
        },
        icon: {
          DEFAULT: 'text-gray-500',
          hover: 'hover:text-gray-600',
        },
      },
      link: {
        DEFAULT: 'text-gray-600',
        hover: 'hover:text-gray-700',
      },
      tag: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        hover: 'hover:bg-gray-200',
      },
      button: {
        primary: 'bg-gray-500 text-white hover:bg-gray-600 active:bg-gray-700',
        secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300',
        disabled: 'bg-gray-200 text-gray-500 cursor-not-allowed',
        ghost: 'text-gray-600 hover:bg-gray-50 active:bg-gray-100',
        outline: 'border border-gray-500 text-gray-700 hover:bg-gray-50 active:bg-gray-100',
      },
      info: {
        bg: 'bg-gray-50',
        text: 'text-gray-800',
        border: 'border-gray-200',
      },
      loader: 'text-gray-600',
      heat: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
      },
      share: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-gray-200 hover:text-gray-800',
        active: 'active:scale-95 active:bg-gray-300 transition-transform',
      },
      report: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-red-100 hover:text-red-700',
        active: 'active:scale-95 active:bg-red-200 transition-transform',
      },
      details: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-blue-100 hover:text-blue-700',
        active: 'active:scale-95 active:bg-blue-200 transition-transform',
      },
      evolution: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-purple-100 hover:text-purple-700',
        active: 'active:scale-95 active:bg-purple-200 transition-transform',
      },
      menu: {
        item: 'text-gray-700 hover:bg-gray-50 hover:text-gray-800',
        itemHover: 'hover:bg-gray-50 hover:text-gray-800',
        active: 'bg-gray-100 text-gray-800',
        activeHover: 'hover:bg-gray-200',
      },
      modal: {
        overlay: 'bg-black bg-opacity-50',
        bg: 'bg-white',
        border: 'border-gray-200',
      },
    },
  },
  blue: {
    name: 'blue',
    label: 'Ocean Blue',
    previewColor: '#2563eb',
    colors: {
      primary: {
        light: 'blue-300',
        DEFAULT: 'blue-500',
        dark: 'blue-600',
      },
      text: {
        primary: 'text-blue-700',
        primaryHover: 'hover:text-blue-800',
        secondary: 'text-blue-600',
        secondaryHover: 'hover:text-blue-700',
        muted: 'text-gray-500',
        mutedHover: 'hover:text-blue-600',
        error: 'text-red-600',
      },
      bg: {
        primary: 'bg-blue-500',
        primaryHover: 'hover:bg-blue-600',
        secondary: 'bg-blue-400',
        secondaryHover: 'hover:bg-blue-500',
        light: 'bg-blue-50',
        lightHover: 'hover:bg-blue-100',
        medium: 'bg-blue-100',
        mediumHover: 'hover:bg-blue-200',
        card: 'bg-white',
        cardHover: 'hover:shadow-md hover:bg-blue-50',
      },
      border: {
        primary: 'border-blue-300',
        ring: 'focus:ring-blue-200',
        input: 'border-gray-300',
        default: 'border-blue-200',
      },
      like: {
        active: 'bg-blue-100 text-blue-700',
        activeHover: 'hover:bg-blue-200 hover:text-blue-800',
        inactive: 'bg-gray-100 text-gray-600',
        hover: 'hover:bg-blue-50 hover:text-blue-600',
        activeClick: 'active:scale-95 active:bg-blue-200 transition-transform',
      },
      favorite: {
        active: 'bg-yellow-100 text-yellow-700',
        activeHover: 'hover:bg-yellow-200 hover:text-yellow-800',
        inactive: 'bg-gray-100 text-gray-600',
        hover: 'hover:bg-yellow-50 hover:text-yellow-600',
        activeClick: 'active:scale-95 active:bg-yellow-200 transition-transform',
      },
      comment: {
        like: {
          active: 'bg-blue-100 text-blue-700',
          activeHover: 'hover:bg-blue-200 hover:text-blue-800',
          inactive: 'bg-gray-100 text-gray-600',
          hover: 'hover:bg-blue-50 hover:text-blue-600',
        },
        icon: {
          DEFAULT: 'text-gray-500',
          hover: 'hover:text-blue-600',
        },
      },
      link: {
        DEFAULT: 'text-blue-600',
        hover: 'hover:text-blue-700',
      },
      tag: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        hover: 'hover:bg-blue-200',
      },
      button: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
        secondary: 'bg-blue-100 text-blue-800 hover:bg-blue-200 active:bg-blue-300',
        disabled: 'bg-gray-200 text-gray-500 cursor-not-allowed',
        ghost: 'text-blue-600 hover:bg-blue-50 active:bg-blue-100',
        outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100',
      },
      info: {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
      },
      loader: 'text-blue-600',
      heat: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
      },
      share: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-blue-100 hover:text-blue-700',
        active: 'active:scale-95 active:bg-blue-200 transition-transform',
      },
      report: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-red-100 hover:text-red-700',
        active: 'active:scale-95 active:bg-red-200 transition-transform',
      },
      details: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-blue-100 hover:text-blue-700',
        active: 'active:scale-95 active:bg-blue-200 transition-transform',
      },
      evolution: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-purple-100 hover:text-purple-700',
        active: 'active:scale-95 active:bg-purple-200 transition-transform',
      },
      menu: {
        item: 'text-gray-700 hover:bg-blue-50 hover:text-blue-700',
        itemHover: 'hover:bg-blue-50 hover:text-blue-700',
        active: 'bg-blue-100 text-blue-800',
        activeHover: 'hover:bg-blue-200',
      },
      modal: {
        overlay: 'bg-black bg-opacity-50',
        bg: 'bg-white',
        border: 'border-gray-200',
      },
    },
  },
  green: {
    name: 'green',
    label: 'Forest Green',
    previewColor: '#059669',
    colors: {
      primary: {
        light: 'green-300',
        DEFAULT: 'green-500',
        dark: 'green-600',
      },
      text: {
        primary: 'text-green-700',
        primaryHover: 'hover:text-green-800',
        secondary: 'text-green-600',
        secondaryHover: 'hover:text-green-700',
        muted: 'text-gray-500',
        mutedHover: 'hover:text-green-600',
        error: 'text-red-600',
      },
      bg: {
        primary: 'bg-green-500',
        primaryHover: 'hover:bg-green-600',
        secondary: 'bg-green-400',
        secondaryHover: 'hover:bg-green-500',
        light: 'bg-green-50',
        lightHover: 'hover:bg-green-100',
        medium: 'bg-green-100',
        mediumHover: 'hover:bg-green-200',
        card: 'bg-white',
        cardHover: 'hover:shadow-md hover:bg-green-50',
      },
      border: {
        primary: 'border-green-300',
        ring: 'focus:ring-green-200',
        input: 'border-gray-300',
        default: 'border-green-200',
      },
      like: {
        active: 'bg-green-100 text-green-700',
        activeHover: 'hover:bg-green-200 hover:text-green-800',
        inactive: 'bg-gray-100 text-gray-600',
        hover: 'hover:bg-green-50 hover:text-green-600',
        activeClick: 'active:scale-95 active:bg-green-200 transition-transform',
      },
      favorite: {
        active: 'bg-yellow-100 text-yellow-700',
        activeHover: 'hover:bg-yellow-200 hover:text-yellow-800',
        inactive: 'bg-gray-100 text-gray-600',
        hover: 'hover:bg-yellow-50 hover:text-yellow-600',
        activeClick: 'active:scale-95 active:bg-yellow-200 transition-transform',
      },
      comment: {
        like: {
          active: 'bg-green-100 text-green-700',
          activeHover: 'hover:bg-green-200 hover:text-green-800',
          inactive: 'bg-gray-100 text-gray-600',
          hover: 'hover:bg-green-50 hover:text-green-600',
        },
        icon: {
          DEFAULT: 'text-gray-500',
          hover: 'hover:text-green-600',
        },
      },
      link: {
        DEFAULT: 'text-green-600',
        hover: 'hover:text-green-700',
      },
      tag: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        hover: 'hover:bg-green-200',
      },
      button: {
        primary: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
        secondary: 'bg-green-100 text-green-800 hover:bg-green-200 active:bg-green-300',
        disabled: 'bg-gray-200 text-gray-500 cursor-not-allowed',
        ghost: 'text-green-600 hover:bg-green-50 active:bg-green-100',
        outline: 'border border-green-600 text-green-600 hover:bg-green-50 active:bg-green-100',
      },
      info: {
        bg: 'bg-green-50',
        text: 'text-green-800',
        border: 'border-green-200',
      },
      loader: 'text-green-600',
      heat: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
      },
      share: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-green-100 hover:text-green-700',
        active: 'active:scale-95 active:bg-green-200 transition-transform',
      },
      report: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-red-100 hover:text-red-700',
        active: 'active:scale-95 active:bg-red-200 transition-transform',
      },
      details: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-blue-100 hover:text-blue-700',
        active: 'active:scale-95 active:bg-blue-200 transition-transform',
      },
      evolution: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-purple-100 hover:text-purple-700',
        active: 'active:scale-95 active:bg-purple-200 transition-transform',
      },
      menu: {
        item: 'text-gray-700 hover:bg-green-50 hover:text-green-700',
        itemHover: 'hover:bg-green-50 hover:text-green-700',
        active: 'bg-green-100 text-green-800',
        activeHover: 'hover:bg-green-200',
      },
      modal: {
        overlay: 'bg-black bg-opacity-50',
        bg: 'bg-white',
        border: 'border-gray-200',
      },
    },
  },
  purple: {
    name: 'purple',
    label: 'Royal Purple',
    previewColor: '#7c3aed',
    colors: {
      primary: {
        light: 'purple-300',
        DEFAULT: 'purple-500',
        dark: 'purple-600',
      },
      text: {
        primary: 'text-purple-700',
        primaryHover: 'hover:text-purple-800',
        secondary: 'text-purple-600',
        secondaryHover: 'hover:text-purple-700',
        muted: 'text-gray-500',
        mutedHover: 'hover:text-purple-600',
        error: 'text-red-600',
      },
      bg: {
        primary: 'bg-purple-500',
        primaryHover: 'hover:bg-purple-600',
        secondary: 'bg-purple-400',
        secondaryHover: 'hover:bg-purple-500',
        light: 'bg-purple-50',
        lightHover: 'hover:bg-purple-100',
        medium: 'bg-purple-100',
        mediumHover: 'hover:bg-purple-200',
        card: 'bg-white',
        cardHover: 'hover:shadow-md hover:bg-purple-50',
      },
      border: {
        primary: 'border-purple-300',
        ring: 'focus:ring-purple-200',
        input: 'border-gray-300',
        default: 'border-purple-200',
      },
      like: {
        active: 'bg-purple-100 text-purple-700',
        activeHover: 'hover:bg-purple-200 hover:text-purple-800',
        inactive: 'bg-gray-100 text-gray-600',
        hover: 'hover:bg-purple-50 hover:text-purple-600',
        activeClick: 'active:scale-95 active:bg-purple-200 transition-transform',
      },
      favorite: {
        active: 'bg-yellow-100 text-yellow-700',
        activeHover: 'hover:bg-yellow-200 hover:text-yellow-800',
        inactive: 'bg-gray-100 text-gray-600',
        hover: 'hover:bg-yellow-50 hover:text-yellow-600',
        activeClick: 'active:scale-95 active:bg-yellow-200 transition-transform',
      },
      comment: {
        like: {
          active: 'bg-purple-100 text-purple-700',
          activeHover: 'hover:bg-purple-200 hover:text-purple-800',
          inactive: 'bg-gray-100 text-gray-600',
          hover: 'hover:bg-purple-50 hover:text-purple-600',
        },
        icon: {
          DEFAULT: 'text-gray-500',
          hover: 'hover:text-purple-600',
        },
      },
      link: {
        DEFAULT: 'text-purple-600',
        hover: 'hover:text-purple-700',
      },
      tag: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        hover: 'hover:bg-purple-200',
      },
      button: {
        primary: 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800',
        secondary: 'bg-purple-100 text-purple-800 hover:bg-purple-200 active:bg-purple-300',
        disabled: 'bg-gray-200 text-gray-500 cursor-not-allowed',
        ghost: 'text-purple-600 hover:bg-purple-50 active:bg-purple-100',
        outline: 'border border-purple-600 text-purple-600 hover:bg-purple-50 active:bg-purple-100',
      },
      info: {
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        border: 'border-purple-200',
      },
      loader: 'text-purple-600',
      heat: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
      },
      share: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-purple-100 hover:text-purple-700',
        active: 'active:scale-95 active:bg-purple-200 transition-transform',
      },
      report: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-red-100 hover:text-red-700',
        active: 'active:scale-95 active:bg-red-200 transition-transform',
      },
      details: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-blue-100 hover:text-blue-700',
        active: 'active:scale-95 active:bg-blue-200 transition-transform',
      },
      evolution: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-purple-100 hover:text-purple-700',
        active: 'active:scale-95 active:bg-purple-200 transition-transform',
      },
      menu: {
        item: 'text-gray-700 hover:bg-purple-50 hover:text-purple-700',
        itemHover: 'hover:bg-purple-50 hover:text-purple-700',
        active: 'bg-purple-100 text-purple-800',
        activeHover: 'hover:bg-purple-200',
      },
      modal: {
        overlay: 'bg-black bg-opacity-50',
        bg: 'bg-white',
        border: 'border-gray-200',
      },
    },
  },
  orange: {
    name: 'orange',
    label: 'Sunset Orange',
    previewColor: '#ea580c',
    colors: {
      primary: {
        light: 'orange-300',
        DEFAULT: 'orange-500',
        dark: 'orange-600',
      },
      text: {
        primary: 'text-orange-700',
        primaryHover: 'hover:text-orange-800',
        secondary: 'text-orange-600',
        secondaryHover: 'hover:text-orange-700',
        muted: 'text-gray-500',
        mutedHover: 'hover:text-orange-600',
        error: 'text-red-600',
      },
      bg: {
        primary: 'bg-orange-500',
        primaryHover: 'hover:bg-orange-600',
        secondary: 'bg-orange-400',
        secondaryHover: 'hover:bg-orange-500',
        light: 'bg-orange-50',
        lightHover: 'hover:bg-orange-100',
        medium: 'bg-orange-100',
        mediumHover: 'hover:bg-orange-200',
        card: 'bg-white',
        cardHover: 'hover:shadow-md hover:bg-orange-50',
      },
      border: {
        primary: 'border-orange-300',
        ring: 'focus:ring-orange-200',
        input: 'border-gray-300',
        default: 'border-orange-200',
      },
      like: {
        active: 'bg-orange-100 text-orange-700',
        activeHover: 'hover:bg-orange-200 hover:text-orange-800',
        inactive: 'bg-gray-100 text-gray-600',
        hover: 'hover:bg-orange-50 hover:text-orange-600',
        activeClick: 'active:scale-95 active:bg-orange-200 transition-transform',
      },
      favorite: {
        active: 'bg-yellow-100 text-yellow-700',
        activeHover: 'hover:bg-yellow-200 hover:text-yellow-800',
        inactive: 'bg-gray-100 text-gray-600',
        hover: 'hover:bg-yellow-50 hover:text-yellow-600',
        activeClick: 'active:scale-95 active:bg-yellow-200 transition-transform',
      },
      comment: {
        like: {
          active: 'bg-orange-100 text-orange-700',
          activeHover: 'hover:bg-orange-200 hover:text-orange-800',
          inactive: 'bg-gray-100 text-gray-600',
          hover: 'hover:bg-orange-50 hover:text-orange-600',
        },
        icon: {
          DEFAULT: 'text-gray-500',
          hover: 'hover:text-orange-600',
        },
      },
      link: {
        DEFAULT: 'text-orange-600',
        hover: 'hover:text-orange-700',
      },
      tag: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        hover: 'hover:bg-orange-200',
      },
      button: {
        primary: 'bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800',
        secondary: 'bg-orange-100 text-orange-800 hover:bg-orange-200 active:bg-orange-300',
        disabled: 'bg-gray-200 text-gray-500 cursor-not-allowed',
        ghost: 'text-orange-600 hover:bg-orange-50 active:bg-orange-100',
        outline: 'border border-orange-600 text-orange-600 hover:bg-orange-50 active:bg-orange-100',
      },
      info: {
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
      },
      loader: 'text-orange-600',
      heat: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
      },
      share: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-orange-100 hover:text-orange-700',
        active: 'active:scale-95 active:bg-orange-200 transition-transform',
      },
      report: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-red-100 hover:text-red-700',
        active: 'active:scale-95 active:bg-red-200 transition-transform',
      },
      details: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-blue-100 hover:text-blue-700',
        active: 'active:scale-95 active:bg-blue-200 transition-transform',
      },
      evolution: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-purple-100 hover:text-purple-700',
        active: 'active:scale-95 active:bg-purple-200 transition-transform',
      },
      menu: {
        item: 'text-gray-700 hover:bg-orange-50 hover:text-orange-700',
        itemHover: 'hover:bg-orange-50 hover:text-orange-700',
        active: 'bg-orange-100 text-orange-800',
        activeHover: 'hover:bg-orange-200',
      },
      modal: {
        overlay: 'bg-black bg-opacity-50',
        bg: 'bg-white',
        border: 'border-gray-200',
      },
    },
  },
  teal: {
    name: 'teal',
    label: 'Mint Teal',
    previewColor: '#0d9488',
    colors: {
      primary: {
        light: 'teal-300',
        DEFAULT: 'teal-500',
        dark: 'teal-600',
      },
      text: {
        primary: 'text-teal-700',
        primaryHover: 'hover:text-teal-800',
        secondary: 'text-teal-600',
        secondaryHover: 'hover:text-teal-700',
        muted: 'text-gray-500',
        mutedHover: 'hover:text-teal-600',
        error: 'text-red-600',
      },
      bg: {
        primary: 'bg-teal-500',
        primaryHover: 'hover:bg-teal-600',
        secondary: 'bg-teal-400',
        secondaryHover: 'hover:bg-teal-500',
        light: 'bg-teal-50',
        lightHover: 'hover:bg-teal-100',
        medium: 'bg-teal-100',
        mediumHover: 'hover:bg-teal-200',
        card: 'bg-white',
        cardHover: 'hover:shadow-md hover:bg-teal-50',
      },
      border: {
        primary: 'border-teal-300',
        ring: 'focus:ring-teal-200',
        input: 'border-gray-300',
        default: 'border-teal-200',
      },
      like: {
        active: 'bg-teal-100 text-teal-700',
        activeHover: 'hover:bg-teal-200 hover:text-teal-800',
        inactive: 'bg-gray-100 text-gray-600',
        hover: 'hover:bg-teal-50 hover:text-teal-600',
        activeClick: 'active:scale-95 active:bg-teal-200 transition-transform',
      },
      favorite: {
        active: 'bg-yellow-100 text-yellow-700',
        activeHover: 'hover:bg-yellow-200 hover:text-yellow-800',
        inactive: 'bg-gray-100 text-gray-600',
        hover: 'hover:bg-yellow-50 hover:text-yellow-600',
        activeClick: 'active:scale-95 active:bg-yellow-200 transition-transform',
      },
      comment: {
        like: {
          active: 'bg-teal-100 text-teal-700',
          activeHover: 'hover:bg-teal-200 hover:text-teal-800',
          inactive: 'bg-gray-100 text-gray-600',
          hover: 'hover:bg-teal-50 hover:text-teal-600',
        },
        icon: {
          DEFAULT: 'text-gray-500',
          hover: 'hover:text-teal-600',
        },
      },
      link: {
        DEFAULT: 'text-teal-600',
        hover: 'hover:text-teal-700',
      },
      tag: {
        bg: 'bg-teal-100',
        text: 'text-teal-800',
        hover: 'hover:bg-teal-200',
      },
      button: {
        primary: 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800',
        secondary: 'bg-teal-100 text-teal-800 hover:bg-teal-200 active:bg-teal-300',
        disabled: 'bg-gray-200 text-gray-500 cursor-not-allowed',
        ghost: 'text-teal-600 hover:bg-teal-50 active:bg-teal-100',
        outline: 'border border-teal-600 text-teal-600 hover:bg-teal-50 active:bg-teal-100',
      },
      info: {
        bg: 'bg-teal-50',
        text: 'text-teal-800',
        border: 'border-teal-200',
      },
      loader: 'text-teal-600',
      heat: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
      },
      share: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-teal-100 hover:text-teal-700',
        active: 'active:scale-95 active:bg-teal-200 transition-transform',
      },
      report: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-red-100 hover:text-red-700',
        active: 'active:scale-95 active:bg-red-200 transition-transform',
      },
      details: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-blue-100 hover:text-blue-700',
        active: 'active:scale-95 active:bg-blue-200 transition-transform',
      },
      evolution: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-purple-100 hover:text-purple-700',
        active: 'active:scale-95 active:bg-purple-200 transition-transform',
      },
      menu: {
        item: 'text-gray-700 hover:bg-teal-50 hover:text-teal-700',
        itemHover: 'hover:bg-teal-50 hover:text-teal-700',
        active: 'bg-teal-100 text-teal-800',
        activeHover: 'hover:bg-teal-200',
      },
      modal: {
        overlay: 'bg-black bg-opacity-50',
        bg: 'bg-white',
        border: 'border-gray-200',
      },
    },
  },
  rose: {
    name: 'rose',
    label: 'Blush Rose',
    previewColor: '#e11d48',
    colors: {
      primary: {
        light: 'rose-300',
        DEFAULT: 'rose-500',
        dark: 'rose-600',
      },
      text: {
        primary: 'text-rose-700',
        primaryHover: 'hover:text-rose-800',
        secondary: 'text-rose-600',
        secondaryHover: 'hover:text-rose-700',
        muted: 'text-gray-500',
        mutedHover: 'hover:text-rose-600',
        error: 'text-red-600',
      },
      bg: {
        primary: 'bg-rose-500',
        primaryHover: 'hover:bg-rose-600',
        secondary: 'bg-rose-400',
        secondaryHover: 'hover:bg-rose-500',
        light: 'bg-rose-50',
        lightHover: 'hover:bg-rose-100',
        medium: 'bg-rose-100',
        mediumHover: 'hover:bg-rose-200',
        card: 'bg-white',
        cardHover: 'hover:shadow-md hover:bg-rose-50',
      },
      border: {
        primary: 'border-rose-300',
        ring: 'focus:ring-rose-200',
        input: 'border-gray-300',
        default: 'border-rose-200',
      },
      like: {
        active: 'bg-rose-100 text-rose-700',
        activeHover: 'hover:bg-rose-200 hover:text-rose-800',
        inactive: 'bg-gray-100 text-gray-600',
        hover: 'hover:bg-rose-50 hover:text-rose-600',
        activeClick: 'active:scale-95 active:bg-rose-200 transition-transform',
      },
      favorite: {
        active: 'bg-yellow-100 text-yellow-700',
        activeHover: 'hover:bg-yellow-200 hover:text-yellow-800',
        inactive: 'bg-gray-100 text-gray-600',
        hover: 'hover:bg-yellow-50 hover:text-yellow-600',
        activeClick: 'active:scale-95 active:bg-yellow-200 transition-transform',
      },
      comment: {
        like: {
          active: 'bg-rose-100 text-rose-700',
          activeHover: 'hover:bg-rose-200 hover:text-rose-800',
          inactive: 'bg-gray-100 text-gray-600',
          hover: 'hover:bg-rose-50 hover:text-rose-600',
        },
        icon: {
          DEFAULT: 'text-gray-500',
          hover: 'hover:text-rose-600',
        },
      },
      link: {
        DEFAULT: 'text-rose-600',
        hover: 'hover:text-rose-700',
      },
      tag: {
        bg: 'bg-rose-100',
        text: 'text-rose-800',
        hover: 'hover:bg-rose-200',
      },
      button: {
        primary: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800',
        secondary: 'bg-rose-100 text-rose-800 hover:bg-rose-200 active:bg-rose-300',
        disabled: 'bg-gray-200 text-gray-500 cursor-not-allowed',
        ghost: 'text-rose-600 hover:bg-rose-50 active:bg-rose-100',
        outline: 'border border-rose-600 text-rose-600 hover:bg-rose-50 active:bg-rose-100',
      },
      info: {
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-200',
      },
      loader: 'text-rose-600',
      heat: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
      },
      share: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-rose-100 hover:text-rose-700',
        active: 'active:scale-95 active:bg-rose-200 transition-transform',
      },
      report: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-red-100 hover:text-red-700',
        active: 'active:scale-95 active:bg-red-200 transition-transform',
      },
      details: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-blue-100 hover:text-blue-700',
        active: 'active:scale-95 active:bg-blue-200 transition-transform',
      },
      evolution: {
        DEFAULT: 'bg-gray-100 text-gray-700',
        hover: 'hover:bg-purple-100 hover:text-purple-700',
        active: 'active:scale-95 active:bg-purple-200 transition-transform',
      },
      menu: {
        item: 'text-gray-700 hover:bg-rose-50 hover:text-rose-700',
        itemHover: 'hover:bg-rose-50 hover:text-rose-700',
        active: 'bg-rose-100 text-rose-800',
        activeHover: 'hover:bg-rose-200',
      },
      modal: {
        overlay: 'bg-black bg-opacity-50',
        bg: 'bg-white',
        border: 'border-gray-200',
      },
    },
  },
}

// Helper functions for theme utilities
export const getThemeClassNames = (themeName: ThemeName): ThemeClassNames => {
  const theme = themes[themeName]
  
  // Fallback to default theme if theme is not found
  if (!theme) {
    return getThemeClassNames(defaultTheme)
  }
  
  return {
    // Text utilities
    title: `${theme.colors.text.primary} font-bold`,
    
    // Button utilities
    likeButton: (isActive: boolean) => isActive ? 
      `${theme.colors.like.active} ${theme.colors.like.activeHover} ${theme.colors.like.activeClick}` : 
      `${theme.colors.like.inactive} ${theme.colors.like.hover} transition-all duration-200`,
    
    favoriteButton: (isActive: boolean) => isActive ? 
      `${theme.colors.favorite.active} ${theme.colors.favorite.activeHover} ${theme.colors.favorite.activeClick}` : 
      `${theme.colors.favorite.inactive} ${theme.colors.favorite.hover} transition-all duration-200`,
    
    commentLikeButton: (isActive: boolean) => isActive ? 
      `${theme.colors.comment.like.active} ${theme.colors.comment.like.activeHover}` : 
      `${theme.colors.comment.like.inactive} ${theme.colors.comment.like.hover} transition-all duration-200`,
    
    shareButton: `${theme.colors.share.DEFAULT} ${theme.colors.share.hover} ${theme.colors.share.active} transition-all duration-200`,
    reportButton: `${theme.colors.report.DEFAULT} ${theme.colors.report.hover} ${theme.colors.report.active} transition-all duration-200`,
    detailsButton: `${theme.colors.details.DEFAULT} ${theme.colors.details.hover} ${theme.colors.details.active} transition-all duration-200`,
    evolutionButton: `${theme.colors.evolution.DEFAULT} ${theme.colors.evolution.hover} ${theme.colors.evolution.active} transition-all duration-200`,
    
    // Component utilities
    disabledButton: `${theme.colors.button.disabled} cursor-not-allowed`,
    primaryButton: theme.colors.button.primary,
    secondaryButton: theme.colors.button.secondary,
    
    // Tag utilities
    tag: `${theme.colors.tag.bg} ${theme.colors.tag.text} ${theme.colors.tag.hover} transition-colors duration-200`,
    
    // Heat indicator
    heat: `${theme.colors.heat.bg} ${theme.colors.heat.text} font-medium px-2.5 py-0.5 rounded-full`,
    
    // Loader
    loader: theme.colors.loader,
    
    // Colors object for direct access
    colors: theme.colors,
    
    // Modal utilities
    modalOverlay: theme.colors.modal.overlay,
    modalBg: theme.colors.modal.bg,
    modalBorder: theme.colors.modal.border,
    
    // Focus ring
    focusRing: theme.colors.border.ring,
    
    // Input
    input: `${theme.colors.bg.light} ${theme.colors.text.primary} ${theme.colors.border.input} focus:outline-none focus:ring-2 ${theme.colors.border.ring}`,
    
    // Link
    link: `${theme.colors.link.DEFAULT} ${theme.colors.link.hover} transition-colors duration-200`,
    
    // Success message
    successMessage: 'bg-green-100 text-green-800 border border-green-200',
    
    // Selected state
    selected: 'bg-blue-100 text-blue-800 font-medium',
    
    // Timeline
    timelineLine: 'bg-gray-200',
    timelineDot: 'bg-blue-500',
    timelineContent: 'bg-white border-gray-200',
    
    // Story box
    storyBox: 'bg-gray-50 rounded border border-gray-100',
    storyTitle: 'text-gray-600',
    
    // Error message
    errorMessage: 'bg-red-50 text-red-700 border border-red-200',
    
    // Input error
    inputError: 'border-red-500 focus:ring-red-200 bg-red-50',
    
    // Menu item
    menuItem: `${theme.colors.menu.item} ${theme.colors.menu.itemHover} transition-colors duration-200`,
  }
}

export const defaultTheme: ThemeName = 'neutral'

export const getThemeNames = (): ThemeName[] => {
  return Object.keys(themes) as ThemeName[]
}
