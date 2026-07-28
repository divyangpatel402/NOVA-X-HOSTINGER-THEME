"use client"

import { motion } from "framer-motion"
import { Server, Cpu, MemoryStick, HardDrive, Wifi, HeartPulse } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import discordConfig from "../../config/sections/discord.json"
import type { DiscordConfig } from "../../types/discord"
import { CurrencySelector, useCurrency } from "../ui/CurrencySelector"
import { useLanguage } from "../../contexts/LanguageContext"

const config = discordConfig as DiscordConfig

export default function DiscordPricingSection() {
  const { t } = useLanguage()
  const { selectedCurrency, setSelectedCurrency, convertPrice } = useCurrency()
  const [selectedPlanType, setSelectedPlanType] = useState(config.planTypes[0].id)

  const currentPlans = config.plans[selectedPlanType] || config.plans[config.planTypes[0].id]

  return (
    <div className="bg-gray-50 dark:bg-[#0a0b0f] relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/banners/node.webp')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-gray-50/40 to-transparent dark:from-[#0a0b0f] dark:via-[#0a0b0f]/30 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/80 to-gray-50/40 dark:from-[#0a0b0f] dark:via-[#0a0b0f]/45 dark:to-[#0a0b0f]/60" />
      </div>

      <div className="relative z-10 mt-16 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-left mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <div className="flex-1">
              <div className="inline-flex items-left gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-tl-2xl rounded-br-2xl mb-4">
                <span className="text-green-500 text-sm font-medium">{t('discord.badge')}</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 orbitron-font">
                {t('discord.title').split(" ").slice(0, -2).join(" ")}{" "}
                <span className="text-green-600 dark:text-green-400 relative">
                  {t('discord.title').split(" ").slice(-2).join(" ")}
                  <motion.svg
                    className="absolute -bottom-2 w-full"
                    height="6"
                    viewBox="0 0 200 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                  >
                    <path
                      d="M1 5C50 1 150 1 199 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </motion.svg>
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl text-lg">{t('discord.subtitle')}</p>
            </div>
            <CurrencySelector 
              selectedCurrency={selectedCurrency} 
              onCurrencyChange={setSelectedCurrency} 
            />
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-800/80 p-1 rounded-xl flex">
            {config.planTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedPlanType(type.id)}
                className={`flex-1 py-3 px-6 rounded-lg font-medium text-sm transition-all duration-300 ${
                  selectedPlanType === type.id
                    ? "bg-white dark:bg-gray-900 text-green-600 dark:text-green-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="relative bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl rounded-md overflow-hidden border border-green-600/20 dark:border-green-400/20 hover:border-green-400 dark:hover:border-green-400/50 hover:bg-[radial-gradient(50%_50%_at_50%_100%,_rgba(34,197,94,0.15)_0%,_transparent_100%)] dark:hover:bg-[radial-gradient(50%_50%_at_50%_100%,_rgba(34,197,94,0.25)_0%,_transparent_100%)] transition-all duration-300"
              >
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-tl-2xl rounded-br-2xl">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className=" flex items-center justify-center">
                      <Image
                        src="/icons/nodejs.png"
                        alt="Node.js"
                        width={64}
                        height={64}
                        className="object-contain bg-transparent"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Discord Bot</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">vCPU Cores</span>
                      </div>
                      <span className="text-lg font-medium text-gray-900 dark:text-white">{plan.cpu}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <MemoryStick className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Memory</span>
                      </div>
                      <span className="text-lg font-medium text-gray-900 dark:text-white">{plan.ram}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">NVMe SSD</span>
                      </div>
                      <span className="text-lg font-medium text-gray-900 dark:text-white">{plan.storage}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Transfer</span>
                      </div>
                      <span className="text-lg font-medium text-gray-900 dark:text-white">{plan.bandwidth}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-6">
                    <HeartPulse className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{plan.uptime}</span>
                  </div>
                  <div className="mt-6">
                    <div className="flex items-baseline justify-center mb-4">
                      <span className="text-3xl font-bold orbitron-font text-gray-900 dark:text-white">
                        {convertPrice(plan.price)}
                      </span>
                      <span className="ml-1 text-gray-500 dark:text-gray-400">{plan.period}</span>
                    </div>
                    <a
                      href={`/checkout/discord/${plan.id}`}
                      className="orbitron-font w-full bg-green-600 hover:bg-green-700 dark:bg-green-600/20 text-white dark:text-green-400 px-6 py-3 rounded-lg font-medium transition-colors duration-300 flex items-center justify-center gap-2"
                    >
                      {t('common.orderNow')}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
