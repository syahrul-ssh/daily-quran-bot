/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Telegraf } from 'telegraf';
import axios from 'axios';
import { User } from 'src/models/core/User';
import * as moment from 'moment-timezone';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private bot;

  constructor(
    private readonly httpService: HttpService,
    @Inject('USER_REPOSITORY') private readonly userRepository: typeof User,
  ) {
    this.bot = new Telegraf(process.env.BOT_TOKEN);
    this.initialize();
  }

  private initialize() {
    this.bot.start(async (ctx) => {
      const existChatId = await this.userRepository.findOne({
        where: {
          chatId: ctx.chat.id,
        },
      });

      if (existChatId) {
        ctx.reply('Anda sudah terdaftar pada sistem');
      }

      if (!existChatId) {
        await this.userRepository.create({
          chatId: ctx.chat.id,
          setHour: 6,
          setMinute: 0,
        });

        ctx.reply("Selamat Datang di Bot Daily Qur'an");
        this.help(ctx);
      }
    });
    this.bot.command('help', (ctx) => this.help(ctx));

    this.bot.command('shuffle', (ctx) => this.suffle(ctx));

    // this.sendAutomaticMessage();
    // this.bot.hears(/^set time ([01]?[0-9]|2[0-3]):([0-5][0-9])\s*$/, (ctx) =>
    //   this.onSetTime(ctx),
    // );

    this.bot.command('settime', (ctx) => {
      const parameter = ctx.message.text.split(' ')[1];

      this.onSetTime(ctx, parameter);
    });

    this.bot.launch().then(() => {
      console.log('Bot has started');
    });
  }

  private help(ctx: any) {
    const message = `Berikut beberapa command yang ada pada bot ini:
    
    /start :
    untuk memulai bot

    /help :
    menampilkan daftar command pada bot

    /shuffle :
    melakukan pengeriman sebuah ayat Al-Qur'an secara langsung

    /settime HH:mm :
    mengatur waktu penjadwalan pengiriman pesan, dengan format HH = 00-23 dan mm = 00-59`;

    ctx.reply(message);
  }

  private async onSetTime(ctx: any, parameter: any) {
    const chatId = ctx.chat?.id;
    const existChatId = await this.userRepository.findOne({
      where: {
        chatId: ctx.chat.id,
      },
    });
    this.logger.log(`User ${chatId} is setting time: ${parameter}`);

    // Validate the time format
    const isValidTime = this.isValidTimeFormat(parameter);

    console.log(isValidTime);
    if (isValidTime) {
      const data = {
        setHour: parseInt(parameter.split(':')[0]),
        setMinute: parseInt(parameter.split(':')[1]),
      };
      if (!existChatId) {
        ctx.reply(`Anda belum terdaftar pada sistem.
        
        masukan perintah /start untuk mendaftarkan diri anda!`);
        return;
      } else {
        await this.userRepository.update(data, {
          where: { chatId: ctx.chat.id },
        });
      }
      // Here, you can implement logic to handle the time, e.g., store it in a database or perform some action
      // For now, let's just reply with a confirmation message
      ctx.reply(`Waktu penjadwalan telah diatur pada ${parameter}`);
    } else {
      ctx.reply(
        'Format waktu yang dimasukan salah, untuk bantuan bisa lakukan perintah /help',
      );
    }
  }

  private isValidTimeFormat(timeString: string): boolean {
    // Validate the time format using a regular expression
    const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return regex.test(timeString);
  }

  private async suffle(ctx) {
    const existChatId = await this.userRepository.findOne({
      where: {
        chatId: ctx.chat.id,
      },
    });
    const chatId = existChatId.chatId;
    let data;

    if (existChatId.suffledSurah) {
      data = await this.dailyQuran(existChatId.chatId, 'suffle');
    } else if (!existChatId.suffledSurah) {
      data = await this.dailyQuran(existChatId.chatId, 'cron');
    } else if (!existChatId) {
      ctx.reply(`Anda belum terdaftar pada sistem.
        
        masukan perintah /start untuk mendaftarkan diri anda!`);
      return;
    } else {
      this.logger.log('Terjadi Kesalahan sistem!');
      this.bot.telegram.sendMessage(chatId, 'Terjadi Kesalahan sistem!');
      return;
    }
    this.userRepository.update(
      {
        suffledSurah: data.shuffle_surah,
        currentSurah: data.get_top_surah,
        currentAyah: data.number,
      },
      {
        where: {
          chatId: chatId,
        },
      },
    );

    const message = `Surah ${data.data.meta_message.name_transliteration}:${data.number}
    ${data.data.meta_message.verse_arabic}

    Terjemah : ${data.data.meta_message.verse_translation}

    Tafsir : ${data.data.meta_message.tafsir}`;

    this.bot.telegram.sendMessage(chatId, message);
  }

  @Cron('* * * * *')
  private async sendAutomaticMessage() {
    this.logger.log('Sedang Mengirim Pesan...');
    const desiredTimeZone = 'Asia/Jakarta';

    const currentDate = new Date();

    const formattedDate = currentDate.toLocaleString('id-ID', {
      timeZone: desiredTimeZone,
    });

    const [datePart, timePart] = formattedDate.split(' ');
    const [hour, minute] = timePart.split('.');
    console.log(`jam ${hour}:${minute}`);
    const users = await this.userRepository.findAll({
      where: {
        setHour: hour,
        setMinute: minute,
      },
    });

    users.map(async (user) => {
      const data = await this.dailyQuran(user.chatId, 'cron');

      this.userRepository.update(
        {
          suffledSurah: data.shuffle_surah,
          currentSurah: data.get_top_surah,
          currentAyah: data.number,
        },
        {
          where: {
            chatId: user.chatId,
          },
        },
      );
      const message = `Surah ${data.data.meta_message.name_transliteration}:${data.number}
      ${data.data.meta_message.verse_arabic}
  
      Terjemah : ${data.data.meta_message.verse_translation}
  
      Tafsir : ${data.data.meta_message.tafsir}`;

      this.bot.telegram.sendMessage(user.chatId, message);
    });
  }

  private async dailyQuran(chatId: number, func: string) {
    const apiEndPoint = process.env.QURAN_API;
    let shuffle_surah, get_top_surah;

    if (func === 'cron') {
      const total_surah = 114;
      const surah_list = [...Array(total_surah).keys()].map((x) => x + 1);
      //get random surah
      shuffle_surah = await this.yates(surah_list);
      get_top_surah = shuffle_surah[0];
    } else if (func === 'suffle') {
      const suffledSurah = await this.userRepository.findOne({
        where: {
          chatId,
        },
      });
      const mappedSuffledSurah = suffledSurah.suffledSurah.indexOf(
        suffledSurah.currentSurah,
      );
      get_top_surah = suffledSurah.suffledSurah[mappedSuffledSurah + 1];
    } else {
      return;
    }
    //getting surah from API
    const surah = await this.getDataApi(`${apiEndPoint}${get_top_surah}`);

    //get random verse
    const totalVerse = surah.numberOfVerses;
    const verseList = [...Array(totalVerse).keys()].map((x) => x + 1);
    const topVerse = await this.yates(verseList);
    const number = topVerse[0];
    const verse = await this.getDataApi(
      `${apiEndPoint}${get_top_surah}/${number}`,
    );
    const data = {
      meta_message: {
        name_transliteration: surah.name.transliteration.id,
        verse_arabic: verse.text.arab,
        verse_translation: verse.translation.id,
        tafsir: verse.tafsir.id.short,
      },
    };

    return { data, shuffle_surah, get_top_surah, number };
  }

  private yates(arr) {
    console.log(arr);
    let i = arr.length,
      j,
      temp;
    while (--i > 0) {
      j = Math.floor(Math.random() * (i + 1));
      temp = arr[j];
      arr[j] = arr[i];
      arr[i] = temp;
    }
    console.log(arr);
    return arr;
  }

  private async getDataApi(data) {
    console.log(data);
    const response = await axios
      .get(data)
      //fetch data
      .then(function (response) {
        return response.data.data;
      })
      //Print error message if accure
      .catch(function () {
        console.log(`Error to fetch data\n`);
      });
    return response;
  }
}
