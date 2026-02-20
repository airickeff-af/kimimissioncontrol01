/**
 * Costume Database - Holiday Costume System
 * Pre-defined costumes for all agents per holiday
 */

const HOLIDAY_COSTUMES = {
  // Fixed Date Holidays
  new_year: {
    id: 'new_year',
    name: 'New Year Celebration',
    date: '01-01',
    icon: '🎆',
    theme: {
      primary: '#FFD700',
      secondary: '#C0C0C0',
      accent: '#FF6B6B'
    },
    costumes: {
      ericf: { head: 'party_hat_gold', body: 'tuxedo_black', accessory: 'confetti_cannon', effect: 'sparkle_burst' },
      nexus: { head: '2025_glasses', body: 'hoodie_metallic', accessory: 'countdown_watch', effect: 'digital_fireworks' },
      codemaster: { head: 'party_hat_silver', body: 'hoodie_coding', accessory: 'keyboard_glow', effect: 'code_confetti' },
      'code-1': { head: 'party_hat_blue', body: 'tshirt_party', accessory: 'noise_maker', effect: 'streamers' },
      'code-2': { head: 'party_hat_green', body: 'tshirt_party', accessory: 'noise_maker', effect: 'streamers' },
      'code-3': { head: 'party_hat_red', body: 'tshirt_party', accessory: 'noise_maker', effect: 'streamers' },
      forge: { head: 'constructor_helmet_party', body: 'overalls_festive', accessory: 'tool_belt_glow', effect: 'sparkle_burst' },
      'forge-2': { head: 'party_headband', body: 'shirt_ui_party', accessory: 'tablet_glow', effect: 'confetti' },
      'forge-3': { head: 'party_headband', body: 'shirt_ui_party', accessory: 'stylus_glow', effect: 'confetti' },
      pixel: { head: 'artist_beret_party', body: 'apron_paint', accessory: 'palette_glow', effect: 'paint_sparkles' },
      glasses: { head: 'research_glasses_party', body: 'labcoat_party', accessory: 'magnifier_glow', effect: 'data_streamers' },
      quill: { head: 'writer_quill_party', body: 'robe_ink', accessory: 'scroll_glow', effect: 'word_sparkles' },
      gary: { head: 'marketing_cap_party', body: 'suit_trendy', accessory: 'megaphone_glow', effect: 'viral_confetti' },
      larry: { head: 'social_headset_party', body: 'hoodie_viral', accessory: 'phone_glow', effect: 'emoji_burst' },
      buzz: { head: 'trend_hat_party', body: 'jacket_hype', accessory: 'tablet_trending', effect: 'hashtag_sparkles' },
      sentry: { head: 'devops_helmet_party', body: 'vest_tactical_party', accessory: 'monitor_glow', effect: 'alert_sparkles' },
      audit: { head: 'qa_crown_party', body: 'robe_judging', accessory: 'clipboard_glow', effect: 'checkmark_burst' },
      cipher: { head: 'security_mask_party', body: 'hoodie_stealth_party', accessory: 'lock_glow', effect: 'shield_sparkles' },
      dealflow: { head: 'sales_hat_party', body: 'suit_sharp', accessory: 'briefcase_glow', effect: 'deal_confetti' },
      coldcall: { head: 'outreach_headset_party', body: 'shirt_casual_party', accessory: 'phone_dial', effect: 'ring_sparkles' },
      scout: { head: 'intel_hat_party', body: 'coat_trench_party', accessory: 'binoculars_glow', effect: 'intel_sparkles' },
      pie: { head: 'data_crown_party', body: 'robe_analytics', accessory: 'chart_glow', effect: 'graph_burst' }
    },
    aiPrompt: "Pixel art character wearing festive New Year's party hat, gold and silver colors, confetti falling, celebration theme, 32x32 sprite, retro game style"
  },

  lunar_new_year: {
    id: 'lunar_new_year',
    name: 'Lunar New Year',
    date: 'variable',
    icon: '🧧',
    theme: {
      primary: '#DC143C',
      secondary: '#FFD700',
      accent: '#FF8C00'
    },
    costumes: {
      ericf: { head: 'dragon_hat_red', body: 'tang_suit_gold', accessory: 'red_envelope', effect: 'lantern_glow' },
      nexus: { head: 'zodiac_ox_horns', body: 'robe_silk_red', accessory: 'lantern_hand', effect: 'firework_trail' },
      codemaster: { head: 'dragon_hat_gold', body: 'tang_suit_black', accessory: 'scroll_lucky', effect: 'coin_shower' },
      'code-1': { head: 'knot_hair_red', body: 'jacket_silk', accessory: 'fan_decorated', effect: 'petal_fall' },
      'code-2': { head: 'knot_hair_gold', body: 'jacket_silk', accessory: 'fan_decorated', effect: 'petal_fall' },
      'code-3': { head: 'knot_hair_jade', body: 'jacket_silk', accessory: 'fan_decorated', effect: 'petal_fall' },
      forge: { head: 'builder_hat_red', body: 'vest_silk', accessory: 'tools_lucky', effect: 'prosperity_glow' },
      'forge-2': { head: 'craftsman_hat', body: 'robe_craftsman', accessory: 'brush_ink', effect: 'calligraphy_float' },
      'forge-3': { head: 'craftsman_hat', body: 'robe_craftsman', accessory: 'brush_ink', effect: 'calligraphy_float' },
      pixel: { head: 'artist_hat_red', body: 'robe_artist', accessory: 'scroll_painting', effect: 'ink_wash' },
      glasses: { head: 'scholar_hat', body: 'robe_scholar', accessory: 'book_ancient', effect: 'wisdom_glow' },
      quill: { head: 'poet_hat', body: 'robe_poet', accessory: 'scroll_poem', effect: 'poetry_float' },
      gary: { head: 'merchant_hat', body: 'robe_merchant', accessory: 'abacus_gold', effect: 'wealth_sparkles' },
      larry: { head: 'messenger_hat', body: 'robe_messenger', accessory: 'scroll_messages', effect: 'connection_glow' },
      buzz: { head: 'town_crier_hat', body: 'robe_crier', accessory: 'gong_lucky', effect: 'announcement_burst' },
      sentry: { head: 'guard_hat_red', body: 'armor_guard', accessory: 'spear_guard', effect: 'protection_aura' },
      audit: { head: 'judge_hat', body: 'robe_judge', accessory: 'scale_balance', effect: 'justice_glow' },
      cipher: { head: 'mystic_mask', body: 'robe_mystic', accessory: 'talisman_lucky', effect: 'mystic_sparkles' },
      dealflow: { head: 'trader_hat', body: 'robe_trader', accessory: 'contract_lucky', effect: 'deal_glow' },
      coldcall: { head: 'herald_hat', body: 'robe_herald', accessory: 'horn_lucky', effect: 'herald_burst' },
      scout: { head: 'explorer_hat', body: 'robe_explorer', accessory: 'map_treasure', effect: 'discovery_glow' },
      pie: { head: 'astrologer_hat', body: 'robe_astrologer', accessory: 'compass_lucky', effect: 'fortune_sparkles' }
    },
    aiPrompt: "Pixel art character in traditional Chinese New Year outfit, red and gold silk clothing, dragon or zodiac animal elements, lanterns, 32x32 sprite, retro game style"
  },

  valentines: {
    id: 'valentines',
    name: "Valentine's Day",
    date: '02-14',
    icon: '💝',
    theme: {
      primary: '#FF69B4',
      secondary: '#FFB6C1',
      accent: '#DC143C'
    },
    costumes: {
      ericf: { head: 'cupid_wings', body: 'tuxedo_pink', accessory: 'arrow_love', effect: 'heart_burst' },
      nexus: { head: 'heart_glasses', body: 'hoodie_love', accessory: 'rose_bouquet', effect: 'heart_float' },
      codemaster: { head: 'dev_crown_hearts', body: 'shirt_code_love', accessory: 'keyboard_heart', effect: 'love_code' },
      'code-1': { head: 'heart_headband', body: 'tshirt_love', accessory: 'chocolate_box', effect: 'sweet_sparkles' },
      'code-2': { head: 'heart_headband', body: 'tshirt_love', accessory: 'teddy_bear', effect: 'cute_burst' },
      'code-3': { head: 'heart_headband', body: 'tshirt_love', accessory: 'love_letter', effect: 'envelope_float' },
      forge: { head: 'heart_helmet', body: 'overalls_pink', accessory: 'hammer_love', effect: 'build_love' },
      'forge-2': { head: 'heart_beret', body: 'shirt_designer_love', accessory: 'tablet_heart', effect: 'design_love' },
      'forge-3': { head: 'heart_beret', body: 'shirt_designer_love', accessory: 'stylus_heart', effect: 'create_love' },
      pixel: { head: 'artist_heart', body: 'apron_pink', accessory: 'brush_heart', effect: 'paint_hearts' },
      glasses: { head: 'researcher_rose', body: 'labcoat_pink', accessory: 'magnifier_heart', effect: 'discover_love' },
      quill: { head: 'poet_rose', body: 'robe_pink', accessory: 'quill_heart', effect: 'poetry_love' },
      gary: { head: 'marketer_cupid', body: 'suit_pink', accessory: 'megaphone_love', effect: 'viral_love' },
      larry: { head: 'social_heart', body: 'hoodie_pink', accessory: 'phone_love', effect: 'message_hearts' },
      buzz: { head: 'trend_heart', body: 'jacket_pink', accessory: 'tablet_love', effect: 'trending_love' },
      sentry: { head: 'guardian_heart', body: 'vest_pink', accessory: 'shield_love', effect: 'protect_love' },
      audit: { head: 'matchmaker_crown', body: 'robe_pink', accessory: 'scale_love', effect: 'perfect_match' },
      cipher: { head: 'secret_admirer', body: 'hoodie_pink', accessory: 'lock_heart', effect: 'secret_love' },
      dealflow: { head: 'romance_hat', body: 'suit_romance', accessory: 'rose_single', effect: 'deal_love' },
      coldcall: { head: 'cupid_trainee', body: 'shirt_romance', accessory: 'phone_heart', effect: 'call_love' },
      scout: { head: 'love_detective', body: 'coat_pink', accessory: 'binoculars_heart', effect: 'find_love' },
      pie: { head: 'love_analyst', body: 'robe_pink', accessory: 'chart_heart', effect: 'data_love' }
    },
    aiPrompt: "Pixel art character with Valentine's Day theme, pink and red colors, hearts and roses, romantic outfit, 32x32 sprite, retro game style"
  },

  st_patricks: {
    id: 'st_patricks',
    name: "St. Patrick's Day",
    date: '03-17',
    icon: '🍀',
    theme: {
      primary: '#228B22',
      secondary: '#32CD32',
      accent: '#FFD700'
    },
    costumes: {
      ericf: { head: 'leprechaun_hat', body: 'suit_green', accessory: 'pot_gold', effect: 'gold_sparkles' },
      nexus: { head: 'shamrock_glasses', body: 'hoodie_green', accessory: 'clover_four', effect: 'lucky_sparkles' },
      codemaster: { head: 'coder_hat_green', body: 'shirt_code_green', accessory: 'keyboard_clover', effect: 'code_lucky' },
      'code-1': { head: 'shamrock_headband', body: 'tshirt_green', accessory: 'beer_mug', effect: 'foam_burst' },
      'code-2': { head: 'shamrock_headband', body: 'tshirt_green', accessory: 'irish_flag', effect: 'flag_wave' },
      'code-3': { head: 'shamrock_headband', body: 'tshirt_green', accessory: 'harp_gold', effect: 'music_notes' },
      forge: { head: 'builder_hat_green', body: 'overalls_green', accessory: 'shovel_gold', effect: 'dig_gold' },
      'forge-2': { head: 'designer_clover', body: 'shirt_green', accessory: 'tablet_clover', effect: 'design_lucky' },
      'forge-3': { head: 'designer_clover', body: 'shirt_green', accessory: 'stylus_clover', effect: 'create_lucky' },
      pixel: { head: 'artist_clover', body: 'apron_green', accessory: 'palette_clover', effect: 'paint_lucky' },
      glasses: { head: 'researcher_clover', body: 'labcoat_green', accessory: 'magnifier_clover', effect: 'find_lucky' },
      quill: { head: 'poet_clover', body: 'robe_green', accessory: 'quill_clover', effect: 'write_lucky' },
      gary: { head: 'marketer_clover', body: 'suit_green', accessory: 'megaphone_clover', effect: 'spread_luck' },
      larry: { head: 'social_clover', body: 'hoodie_green', accessory: 'phone_clover', effect: 'share_luck' },
      buzz: { head: 'trend_clover', body: 'jacket_green', accessory: 'tablet_clover', effect: 'viral_luck' },
      sentry: { head: 'guardian_clover', body: 'vest_green', accessory: 'shield_clover', effect: 'protect_luck' },
      audit: { head: 'judge_clover', body: 'robe_green', accessory: 'scale_clover', effect: 'fair_luck' },
      cipher: { head: 'mystic_clover', body: 'hoodie_green', accessory: 'lock_clover', effect: 'secret_luck' },
      dealflow: { head: 'trader_clover', body: 'robe_green', accessory: 'contract_clover', effect: 'deal_luck' },
      coldcall: { head: 'herald_clover', body: 'shirt_green', accessory: 'horn_clover', effect: 'announce_luck' },
      scout: { head: 'explorer_clover', body: 'coat_green', accessory: 'map_clover', effect: 'find_treasure' },
      pie: { head: 'analyst_clover', body: 'robe_green', accessory: 'chart_clover', effect: 'lucky_numbers' }
    },
    aiPrompt: "Pixel art character with St. Patrick's Day theme, green outfit with shamrocks, leprechaun elements, gold accents, 32x32 sprite, retro game style"
  },

  easter: {
    id: 'easter',
    name: 'Easter',
    date: 'variable',
    icon: '🐰',
    theme: {
      primary: '#FFB6C1',
      secondary: '#E6E6FA',
      accent: '#98FB98'
    },
    costumes: {
      ericf: { head: 'bunny_ears', body: 'suit_pastel', accessory: 'basket_eggs', effect: 'egg_hunt' },
      nexus: { head: 'chick_hood', body: 'hoodie_yellow', accessory: 'egg_decorated', effect: 'chick_cheer' },
      codemaster: { head: 'bunny_coder', body: 'shirt_code_pastel', accessory: 'keyboard_egg', effect: 'code_eggs' },
      'code-1': { head: 'bunny_ears_mini', body: 'tshirt_pastel', accessory: 'egg_painted', effect: 'paint_egg' },
      'code-2': { head: 'bunny_ears_mini', body: 'tshirt_pastel', accessory: 'carrot', effect: 'munch_carrot' },
      'code-3': { head: 'bunny_ears_mini', body: 'tshirt_pastel', accessory: 'egg_golden', effect: 'rare_egg' },
      forge: { head: 'bunny_builder', body: 'overalls_pastel', accessory: 'basket_tools', effect: 'build_nest' },
      'forge-2': { head: 'chick_designer', body: 'shirt_pastel', accessory: 'tablet_egg', effect: 'design_egg' },
      'forge-3': { head: 'chick_designer', body: 'shirt_pastel', accessory: 'stylus_egg', effect: 'draw_egg' },
      pixel: { head: 'bunny_artist', body: 'apron_pastel', accessory: 'brush_egg', effect: 'paint_pastel' },
      glasses: { head: 'bunny_researcher', body: 'labcoat_pastel', accessory: 'magnifier_egg', effect: 'study_egg' },
      quill: { head: 'bunny_poet', body: 'robe_pastel', accessory: 'quill_egg', effect: 'write_egg' },
      gary: { head: 'bunny_marketer', body: 'suit_pastel', accessory: 'megaphone_egg', effect: 'egg_campaign' },
      larry: { head: 'bunny_social', body: 'hoodie_pastel', accessory: 'phone_egg', effect: 'egg_selfie' },
      buzz: { head: 'bunny_trend', body: 'jacket_pastel', accessory: 'tablet_egg', effect: 'viral_egg' },
      sentry: { head: 'bunny_guard', body: 'vest_pastel', accessory: 'shield_egg', effect: 'protect_eggs' },
      audit: { head: 'bunny_judge', body: 'robe_pastel', accessory: 'scale_egg', effect: 'judge_egg' },
      cipher: { head: 'bunny_mystic', body: 'hoodie_pastel', accessory: 'lock_egg', effect: 'egg_secret' },
      dealflow: { head: 'bunny_trader', body: 'robe_pastel', accessory: 'contract_egg', effect: 'egg_deal' },
      coldcall: { head: 'bunny_herald', body: 'shirt_pastel', accessory: 'horn_egg', effect: 'announce_egg' },
      scout: { head: 'bunny_explorer', body: 'coat_pastel', accessory: 'map_egg', effect: 'find_eggs' },
      pie: { head: 'bunny_analyst', body: 'robe_pastel', accessory: 'chart_egg', effect: 'egg_stats' }
    },
    aiPrompt: "Pixel art character with Easter theme, pastel colors, bunny ears or chick elements, decorated eggs, spring atmosphere, 32x32 sprite, retro game style"
  },

  halloween: {
    id: 'halloween',
    name: 'Halloween',
    date: '10-31',
    icon: '🎃',
    theme: {
      primary: '#FF6600',
      secondary: '#4B0082',
      accent: '#000000'
    },
    costumes: {
      ericf: { head: 'vampire_cape', body: 'suit_vampire', accessory: 'pumpkin_lantern', effect: 'bat_flight' },
      nexus: { head: 'ghost_sheet', body: 'hoodie_ghost', accessory: 'candy_bag', effect: 'spooky_float' },
      codemaster: { head: 'witch_hat_code', body: 'robe_witch', accessory: 'keyboard_spell', effect: 'code_magic' },
      'code-1': { head: 'pumpkin_head', body: 'tshirt_orange', accessory: 'candy_corn', effect: 'trick_treat' },
      'code-2': { head: 'skeleton_mask', body: 'tshirt_black', accessory: 'skull_candy', effect: 'bone_rattle' },
      'code-3': { head: 'mummy_wrap', body: 'tshirt_white', accessory: 'bandage_candy', effect: 'mummy_walk' },
      forge: { head: 'frankenstein_bolt', body: 'overalls_green_dark', accessory: 'tool_monster', effect: 'thunder_spark' },
      'forge-2': { head: 'zombie_designer', body: 'shirt_torn', accessory: 'tablet_brain', effect: 'design_horror' },
      'forge-3': { head: 'skeleton_designer', body: 'shirt_bone', accessory: 'stylus_bone', effect: 'draw_death' },
      pixel: { head: 'demon_artist', body: 'apron_blood', accessory: 'brush_blood', effect: 'paint_horror' },
      glasses: { head: 'mad_scientist', body: 'labcoat_crazy', accessory: 'potion_green', effect: 'experiment_burst' },
      quill: { head: 'phantom_writer', body: 'robe_phantom', accessory: 'quill_ghost', effect: 'haunted_words' },
      gary: { head: 'devil_marketer', body: 'suit_devil', accessory: 'pitchfork_deal', effect: 'deal_devil' },
      larry: { head: 'ghost_social', body: 'hoodie_phantom', accessory: 'phone_spirit', effect: 'ghost_post' },
      buzz: { head: 'trend_vampire', body: 'jacket_cape', accessory: 'tablet_blood', effect: 'viral_horror' },
      sentry: { head: 'werewolf_guard', body: 'vest_fur', accessory: 'shield_claw', effect: 'howl_moon' },
      audit: { head: 'grim_judge', body: 'robe_death', accessory: 'scale_soul', effect: 'judgment_ghost' },
      cipher: { head: 'spy_shadow', body: 'hoodie_dark', accessory: 'lock_cursed', effect: 'shadow_spook' },
      dealflow: { head: 'pumpkin_sales', body: 'suit_pumpkin', accessory: 'contract_curse', effect: 'cursed_deal' },
      coldcall: { head: 'scream_herald', body: 'shirt_horror', accessory: 'phone_scream', effect: 'horror_call' },
      scout: { head: 'detective_noir', body: 'coat_dark', accessory: 'magnifier_mystery', effect: 'solve_horror' },
      pie: { head: 'fortune_teller', body: 'robe_mystic', accessory: 'crystal_ball', effect: 'predict_doom' }
    },
    aiPrompt: "Pixel art character with Halloween theme, spooky costume, pumpkin or ghost elements, dark colors with orange and purple, 32x32 sprite, retro game style"
  },

  thanksgiving: {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    date: '11-4th-thu',
    icon: '🦃',
    theme: {
      primary: '#D2691E',
      secondary: '#FF8C00',
      accent: '#8B4513'
    },
    costumes: {
      ericf: { head: 'pilgrim_hat', body: 'suit_pilgrim', accessory: 'turkey_platter', effect: 'feast_glow' },
      nexus: { head: 'turkey_hat', body: 'hoodie_autumn', accessory: 'cornucopia', effect: 'harvest_blessing' },
      codemaster: { head: 'native_headdress_code', body: 'shirt_feather', accessory: 'keyboard_corn', effect: 'code_harvest' },
      'code-1': { head: 'pilgrim_bonnet', body: 'tshirt_autumn', accessory: 'pie_pumpkin', effect: 'bake_pie' },
      'code-2': { head: 'turkey_ears', body: 'tshirt_autumn', accessory: 'corn_cob', effect: 'munch_corn' },
      'code-3': { head: 'leaf_crown', body: 'tshirt_autumn', accessory: 'acorn', effect: 'autumn_sparkles' },
      forge: { head: 'builder_pilgrim', body: 'overalls_autumn', accessory: 'tool_harvest', effect: 'build_feast' },
      'forge-2': { head: 'designer_leaf', body: 'shirt_autumn', accessory: 'tablet_pie', effect: 'design_feast' },
      'forge-3': { head: 'designer_leaf', body: 'shirt_autumn', accessory: 'stylus_pie', effect: 'draw_feast' },
      pixel: { head: 'artist_leaf', body: 'apron_autumn', accessory: 'brush_pie', effect: 'paint_harvest' },
      glasses: { head: 'researcher_pilgrim', body: 'labcoat_autumn', accessory: 'magnifier_corn', effect: 'study_harvest' },
      quill: { head: 'poet_leaf', body: 'robe_autumn', accessory: 'quill_corn', effect: 'write_gratitude' },
      gary: { head: 'marketer_pilgrim', body: 'suit_autumn', accessory: 'megaphone_turkey', effect: 'feast_campaign' },
      larry: { head: 'social_leaf', body: 'hoodie_autumn', accessory: 'phone_turkey', effect: 'thankful_post' },
      buzz: { head: 'trend_pilgrim', body: 'jacket_autumn', accessory: 'tablet_turkey', effect: 'viral_feast' },
      sentry: { head: 'guardian_pilgrim', body: 'vest_autumn', accessory: 'shield_turkey', effect: 'protect_feast' },
      audit: { head: 'judge_pilgrim', body: 'robe_autumn', accessory: 'scale_feast', effect: 'fair_feast' },
      cipher: { head: 'mystic_leaf', body: 'hoodie_autumn', accessory: 'lock_corn', effect: 'secret_recipe' },
      dealflow: { head: 'trader_pilgrim', body: 'robe_autumn', accessory: 'contract_feast', effect: 'deal_feast' },
      coldcall: { head: 'herald_pilgrim', body: 'shirt_autumn', accessory: 'horn_feast', effect: 'announce_feast' },
      scout: { head: 'explorer_pilgrim', body: 'coat_autumn', accessory: 'map_feast', effect: 'find_feast' },
      pie: { head: 'analyst_leaf', body: 'robe_autumn', accessory: 'chart_feast', effect: 'feast_stats' }
    },
    aiPrompt: "Pixel art character with Thanksgiving theme, autumn colors, pilgrim or turkey elements, harvest atmosphere, 32x32 sprite, retro game style"
  },

  christmas: {
    id: 'christmas',
    name: 'Christmas',
    date: '12-25',
    icon: '🎄',
    theme: {
      primary: '#DC143C',
      secondary: '#228B22',
      accent: '#FFD700'
    },
    costumes: {
      ericf: { head: 'santa_hat', body: 'suit_santa', accessory: 'sack_gifts', effect: 'snow_fall' },
      nexus: { head: 'reindeer_antlers', body: 'hoodie_red', accessory: 'bell_jingle', effect: 'sleigh_ride' },
      codemaster: { head: 'elf_hat_code', body: 'tunic_elf', accessory: 'keyboard_toy', effect: 'code_toys' },
      'code-1': { head: 'snowman_hat', body: 'tshirt_white', accessory: 'candy_cane', effect: 'snow_sparkles' },
      'code-2': { head: 'gingerbread_hat', body: 'tshirt_brown', accessory: 'cookie_gift', effect: 'ginger_sweet' },
      'code-3': { head: 'ornament_hat', body: 'tshirt_green', accessory: 'star_top', effect: 'tree_light' },
      forge: { head: 'elf_builder', body: 'tunic_elf', accessory: 'tool_toy', effect: 'build_toys' },
      'forge-2': { head: 'elf_designer', body: 'tunic_elf', accessory: 'tablet_toy', effect: 'design_toys' },
      'forge-3': { head: 'elf_designer', body: 'tunic_elf', accessory: 'stylus_toy', effect: 'draw_toys' },
      pixel: { head: 'elf_artist', body: 'tunic_elf', accessory: 'brush_toy', effect: 'paint_toys' },
      glasses: { head: 'elf_researcher', body: 'tunic_elf', accessory: 'magnifier_toy', effect: 'study_toys' },
      quill: { head: 'elf_poet', body: 'tunic_elf', accessory: 'quill_list', effect: 'write_list' },
      gary: { head: 'elf_marketer', body: 'tunic_elf', accessory: 'megaphone_joy', effect: 'spread_joy' },
      larry: { head: 'elf_social', body: 'tunic_elf', accessory: 'phone_joy', effect: 'share_joy' },
      buzz: { head: 'elf_trend', body: 'tunic_elf', accessory: 'tablet_joy', effect: 'viral_joy' },
      sentry: { head: 'nutcracker_guard', body: 'uniform_nutcracker', accessory: 'shield_candy', effect: 'protect_toys' },
      audit: { head: 'elf_judge', body: 'tunic_elf', accessory: 'scale_nice', effect: 'naughty_nice' },
      cipher: { head: 'spy_elf', body: 'tunic_elf', accessory: 'lock_secret', effect: 'secret_gifts' },
      dealflow: { head: 'elf_trader', body: 'tunic_elf', accessory: 'contract_joy', effect: 'deal_joy' },
      coldcall: { head: 'elf_herald', body: 'tunic_elf', accessory: 'horn_joy', effect: 'announce_joy' },
      scout: { head: 'elf_explorer', body: 'tunic_elf', accessory: 'map_north', effect: 'find_pole' },
      pie: { head: 'elf_analyst', body: 'tunic_elf', accessory: 'chart_joy', effect: 'joy_stats' }
    },
    aiPrompt: "Pixel art character with Christmas theme, red and green colors, Santa hat or elf costume, snow elements, 32x32 sprite, retro game style"
  },

  hanukkah: {
    id: 'hanukkah',
    name: 'Hanukkah',
    date: 'variable',
    icon: '🕎',
    theme: {
      primary: '#0000CD',
      secondary: '#C0C0C0',
      accent: '#FFD700'
    },
    costumes: {
      ericf: { head: 'yarmulke_gold', body: 'suit_blue', accessory: 'menorah_lit', effect: 'candle_glow' },
      nexus: { head: 'dreidel_hat', body: 'hoodie_blue', accessory: 'dreidel_spinning', effect: 'spin_light' },
      codemaster: { head: 'coder_yarmulke', body: 'shirt_code_blue', accessory: 'keyboard_menorah', effect: 'code_light' },
      'code-1': { head: 'star_hat', body: 'tshirt_blue', accessory: 'gelt_coin', effect: 'gelt_shower' },
      'code-2': { head: 'star_hat', body: 'tshirt_silver', accessory: 'latke_plate', effect: 'latke_steam' },
      'code-3': { head: 'star_hat', body: 'tshirt_gold', accessory: 'oil_jar', effect: 'miracle_glow' },
      forge: { head: 'builder_yarmulke', body: 'overalls_blue', accessory: 'tool_menorah', effect: 'build_light' },
      'forge-2': { head: 'designer_star', body: 'shirt_blue', accessory: 'tablet_menorah', effect: 'design_light' },
      'forge-3': { head: 'designer_star', body: 'shirt_blue', accessory: 'stylus_menorah', effect: 'draw_light' },
      pixel: { head: 'artist_yarmulke', body: 'apron_blue', accessory: 'brush_menorah', effect: 'paint_light' },
      glasses: { head: 'researcher_yarmulke', body: 'labcoat_blue', accessory: 'magnifier_menorah', effect: 'study_light' },
      quill: { head: 'poet_yarmulke', body: 'robe_blue', accessory: 'quill_menorah', effect: 'write_light' },
      gary: { head: 'marketer_yarmulke', body: 'suit_blue', accessory: 'megaphone_menorah', effect: 'spread_light' },
      larry: { head: 'social_yarmulke', body: 'hoodie_blue', accessory: 'phone_menorah', effect: 'share_light' },
      buzz: { head: 'trend_yarmulke', body: 'jacket_blue', accessory: 'tablet_menorah', effect: 'viral_light' },
      sentry: { head: 'guardian_yarmulke', body: 'vest_blue', accessory: 'shield_menorah', effect: 'protect_light' },
      audit: { head: 'judge_yarmulke', body: 'robe_blue', accessory: 'scale_menorah', effect: 'fair_light' },
      cipher: { head: 'mystic_yarmulke', body: 'hoodie_blue', accessory: 'lock_menorah', effect: 'secret_light' },
      dealflow: { head: 'trader_yarmulke', body: 'robe_blue', accessory: 'contract_menorah', effect: 'deal_light' },
      coldcall: { head: 'herald_yarmulke', body: 'shirt_blue', accessory: 'horn_menorah', effect: 'announce_light' },
      scout: { head: 'explorer_yarmulke', body: 'coat_blue', accessory: 'map_menorah', effect: 'find_light' },
      pie: { head: 'analyst_yarmulke', body: 'robe_blue', accessory: 'chart_menorah', effect: 'light_stats' }
    },
    aiPrompt: "Pixel art character with Hanukkah theme, blue and silver colors, menorah or dreidel elements, festival of lights atmosphere, 32x32 sprite, retro game style"
  },

  diwali: {
    id: 'diwali',
    name: 'Diwali',
    date: 'variable',
    icon: '🪔',
    theme: {
      primary: '#FF6600',
      secondary: '#FFD700',
      accent: '#9370DB'
    },
    costumes: {
      ericf: { head: 'turban_gold', body: 'kurta_silk', accessory: 'diya_lit', effect: 'festival_lights' },
      nexus: { head: 'crown_flowers', body: 'outfit_festival', accessory: 'lantern_sky', effect: 'light_burst' },
      codemaster: { head: 'turban_code', body: 'kurta_code', accessory: 'keyboard_diya', effect: 'code_light' },
      'code-1': { head: 'flower_hair', body: 'outfit_orange', accessory: 'rangoli_pattern', effect: 'color_burst' },
      'code-2': { head: 'flower_hair', body: 'outfit_purple', accessory: 'firework_spark', effect: 'sparkle_burst' },
      'code-3': { head: 'flower_hair', body: 'outfit_gold', accessory: 'sweet_ladoo', effect: 'sweet_glow' },
      forge: { head: 'builder_turban', body: 'kurta_builder', accessory: 'tool_diya', effect: 'build_light' },
      'forge-2': { head: 'designer_flower', body: 'outfit_festival', accessory: 'tablet_rangoli', effect: 'design_light' },
      'forge-3': { head: 'designer_flower', body: 'outfit_festival', accessory: 'stylus_rangoli', effect: 'draw_light' },
      pixel: { head: 'artist_turban', body: 'kurta_artist', accessory: 'brush_rangoli', effect: 'paint_light' },
      glasses: { head: 'researcher_turban', body: 'kurta_researcher', accessory: 'magnifier_diya', effect: 'study_light' },
      quill: { head: 'poet_turban', body: 'kurta_poet', accessory: 'quill_diya', effect: 'write_light' },
      gary: { head: 'marketer_turban', body: 'kurta_marketer', accessory: 'megaphone_diya', effect: 'spread_light' },
      larry: { head: 'social_flower', body: 'outfit_festival', accessory: 'phone_diya', effect: 'share_light' },
      buzz: { head: 'trend_turban', body: 'kurta_trend', accessory: 'tablet_diya', effect: 'viral_light' },
      sentry: { head: 'guardian_turban', body: 'kurta_guardian', accessory: 'shield_diya', effect: 'protect_light' },
      audit: { head: 'judge_turban', body: 'kurta_judge', accessory: 'scale_diya', effect: 'fair_light' },
      cipher: { head: 'mystic_turban', body: 'kurta_mystic', accessory: 'lock_diya', effect: 'secret_light' },
      dealflow: { head: 'trader_turban', body: 'kurta_trader', accessory: 'contract_diya', effect: 'deal_light' },
      coldcall: { head: 'herald_turban', body: 'kurta_herald', accessory: 'horn_diya', effect: 'announce_light' },
      scout: { head: 'explorer_turban', body: 'kurta_explorer', accessory: 'map_diya', effect: 'find_light' },
      pie: { head: 'analyst_turban', body: 'kurta_analyst', accessory: 'chart_diya', effect: 'light_stats' }
    },
    aiPrompt: "Pixel art character with Diwali theme, orange and gold colors, diyas and rangoli elements, festival of lights atmosphere, 32x32 sprite, retro game style"
  },

  pride: {
    id: 'pride',
    name: 'Pride Month',
    date: '06-01',
    icon: '🌈',
    theme: {
      primary: '#FF0000',
      secondary: '#FF8C00',
      accent: '#FFD700',
      rainbow: ['#FF0000', '#FF8C00', '#FFD700', '#008000', '#0000FF', '#4B0082', '#9400D3']
    },
    costumes: {
      ericf: { head: 'rainbow_crown', body: 'suit_rainbow', accessory: 'flag_pride', effect: 'rainbow_burst' },
      nexus: { head: 'rainbow_hair', body: 'hoodie_rainbow', accessory: 'heart_progress', effect: 'love_sparkles' },
      codemaster: { head: 'coder_rainbow', body: 'shirt_code_rainbow', accessory: 'keyboard_pride', effect: 'code_love' },
      'code-1': { head: 'rainbow_headband', body: 'tshirt_rainbow', accessory: 'flag_trans', effect: 'trans_sparkles' },
      'code-2': { head: 'rainbow_headband', body: 'tshirt_rainbow', accessory: 'flag_bi', effect: 'bi_sparkles' },
      'code-3': { head: 'rainbow_headband', body: 'tshirt_rainbow', accessory: 'flag_pan', effect: 'pan_sparkles' },
      forge: { head: 'builder_rainbow', body: 'overalls_rainbow', accessory: 'tool_pride', effect: 'build_love' },
      'forge-2': { head: 'designer_rainbow', body: 'shirt_rainbow', accessory: 'tablet_pride', effect: 'design_love' },
      'forge-3': { head: 'designer_rainbow', body: 'shirt_rainbow', accessory: 'stylus_pride', effect: 'create_love' },
      pixel: { head: 'artist_rainbow', body: 'apron_rainbow', accessory: 'brush_pride', effect: 'paint_love' },
      glasses: { head: 'researcher_rainbow', body: 'labcoat_rainbow', accessory: 'magnifier_pride', effect: 'discover_love' },
      quill: { head: 'poet_rainbow', body: 'robe_rainbow', accessory: 'quill_pride', effect: 'write_love' },
      gary: { head: 'marketer_rainbow', body: 'suit_rainbow', accessory: 'megaphone_pride', effect: 'spread_love' },
      larry: { head: 'social_rainbow', body: 'hoodie_rainbow', accessory: 'phone_pride', effect: 'share_love' },
      buzz: { head: 'trend_rainbow', body: 'jacket_rainbow', accessory: 'tablet_pride', effect: 'viral_love' },
      sentry: { head: 'guardian_rainbow', body: 'vest_rainbow', accessory: 'shield_pride', effect: 'protect_love' },
      audit: { head: 'judge_rainbow', body: 'robe_rainbow', accessory: 'scale_pride', effect: 'equality_glow' },
      cipher: { head: 'mystic_rainbow', body: 'hoodie_rainbow', accessory: 'lock_pride', effect: 'pride_secret' },
      dealflow: { head: 'trader_rainbow', body: 'robe_rainbow', accessory: 'contract_pride', effect: 'deal_love' },
      coldcall: { head: 'herald_rainbow', body: 'shirt_rainbow', accessory: 'horn_pride', effect: 'announce_love' },
      scout: { head: 'explorer_rainbow', body: 'coat_rainbow', accessory: 'map_pride', effect: 'find_love' },
      pie: { head: 'analyst_rainbow', body: 'robe_rainbow', accessory: 'chart_pride', effect: 'love_stats' }
    },
    aiPrompt: "Pixel art character with Pride theme, rainbow colors, inclusive and celebratory, love and equality symbols, 32x32 sprite, retro game style"
  },

  birthday: {
    id: 'birthday',
    name: 'Birthday Celebration',
    date: 'user_defined',
    icon: '🎂',
    theme: {
      primary: '#FF69B4',
      secondary: '#87CEEB',
      accent: '#FFD700'
    },
    costumes: {
      default: {
        head: 'cake_hat',
        body: 'party_outfit',
        accessory: 'balloon_bunch',
        effect: 'confetti_rain'
      }
    },
    aiPrompt: "Pixel art character with birthday celebration theme, cake hat and balloons, colorful party outfit, confetti, 32x32 sprite, retro game style"
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HOLIDAY_COSTUMES };
}
