import React from 'react'
import Sidebar from './Sidebar'

const Analytics = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics
            </h1>

            <p className="mt-1 text-gray-500">
              Track your email performance and campaign engagement.
            </p>
          </div>

          <select className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-black">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
        </div>


        {/* Overview Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 mb-8">

          {/* Emails Sent */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Emails Sent
            </p>

            <div className="mt-3 flex items-end justify-between">
              <h2 className="text-3xl font-bold text-gray-900">
                48,250
              </h2>

              <span className="text-sm font-medium text-green-600">
                +12.5%
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Compared to previous period
            </p>
          </div>


          {/* Delivery Rate */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Delivery Rate
            </p>

            <div className="mt-3 flex items-end justify-between">
              <h2 className="text-3xl font-bold text-gray-900">
                98.4%
              </h2>

              <span className="text-sm font-medium text-green-600">
                +1.2%
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Successfully delivered
            </p>
          </div>


          {/* Open Rate */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Open Rate
            </p>

            <div className="mt-3 flex items-end justify-between">
              <h2 className="text-3xl font-bold text-gray-900">
                42.7%
              </h2>

              <span className="text-sm font-medium text-green-600">
                +4.6%
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Recipients who opened emails
            </p>
          </div>


          {/* Click Rate */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Click Rate
            </p>

            <div className="mt-3 flex items-end justify-between">
              <h2 className="text-3xl font-bold text-gray-900">
                8.9%
              </h2>

              <span className="text-sm font-medium text-green-600">
                +2.1%
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Recipients who clicked a link
            </p>
          </div>

        </div>


        {/* Chart Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">

          {/* Email Activity */}
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Email Activity
              </h2>

              <p className="text-sm text-gray-500">
                Emails sent and opened over the selected period.
              </p>
            </div>


            {/* Fake Chart */}
            <div className="flex h-64 items-end gap-4 border-b border-gray-200 px-4">

              <div className="flex h-full flex-1 items-end gap-2">
                <div className="w-full rounded-t-md bg-gray-900" style={{ height: '35%' }}></div>
                <div className="w-full rounded-t-md bg-gray-300" style={{ height: '20%' }}></div>
              </div>

              <div className="flex h-full flex-1 items-end gap-2">
                <div className="w-full rounded-t-md bg-gray-900" style={{ height: '48%' }}></div>
                <div className="w-full rounded-t-md bg-gray-300" style={{ height: '30%' }}></div>
              </div>

              <div className="flex h-full flex-1 items-end gap-2">
                <div className="w-full rounded-t-md bg-gray-900" style={{ height: '65%' }}></div>
                <div className="w-full rounded-t-md bg-gray-300" style={{ height: '42%' }}></div>
              </div>

              <div className="flex h-full flex-1 items-end gap-2">
                <div className="w-full rounded-t-md bg-gray-900" style={{ height: '52%' }}></div>
                <div className="w-full rounded-t-md bg-gray-300" style={{ height: '38%' }}></div>
              </div>

              <div className="flex h-full flex-1 items-end gap-2">
                <div className="w-full rounded-t-md bg-gray-900" style={{ height: '78%' }}></div>
                <div className="w-full rounded-t-md bg-gray-300" style={{ height: '55%' }}></div>
              </div>

              <div className="flex h-full flex-1 items-end gap-2">
                <div className="w-full rounded-t-md bg-gray-900" style={{ height: '90%' }}></div>
                <div className="w-full rounded-t-md bg-gray-300" style={{ height: '65%' }}></div>
              </div>

              <div className="flex h-full flex-1 items-end gap-2">
                <div className="w-full rounded-t-md bg-gray-900" style={{ height: '72%' }}></div>
                <div className="w-full rounded-t-md bg-gray-300" style={{ height: '50%' }}></div>
              </div>

            </div>


            <div className="mt-4 flex justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-900"></span>
                Sent
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-300"></span>
                Opened
              </div>
            </div>

          </div>


          {/* Engagement */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-gray-900">
              Engagement
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Overall recipient engagement.
            </p>


            <div className="mt-8 space-y-6">

              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-600">
                    Open Rate
                  </span>

                  <span className="font-medium text-gray-900">
                    42.7%
                  </span>
                </div>

                <div className="h-2 rounded-full bg-gray-200">
                  <div className="h-2 w-[43%] rounded-full bg-gray-900"></div>
                </div>
              </div>


              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-600">
                    Click Rate
                  </span>

                  <span className="font-medium text-gray-900">
                    8.9%
                  </span>
                </div>

                <div className="h-2 rounded-full bg-gray-200">
                  <div className="h-2 w-[9%] rounded-full bg-gray-900"></div>
                </div>
              </div>


              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-600">
                    Bounce Rate
                  </span>

                  <span className="font-medium text-gray-900">
                    1.6%
                  </span>
                </div>

                <div className="h-2 rounded-full bg-gray-200">
                  <div className="h-2 w-[2%] rounded-full bg-red-500"></div>
                </div>
              </div>


              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-600">
                    Unsubscribe Rate
                  </span>

                  <span className="font-medium text-gray-900">
                    0.4%
                  </span>
                </div>

                <div className="h-2 rounded-full bg-gray-200">
                  <div className="h-2 w-[1%] rounded-full bg-red-500"></div>
                </div>
              </div>

            </div>

          </div>

        </div>


        {/* Bottom Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Top Campaigns */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Top Campaigns
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Campaigns with the highest engagement.
              </p>
            </div>


            <div className="divide-y divide-gray-100">

              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium text-gray-900">
                    Summer Promotion
                  </p>

                  <p className="text-sm text-gray-500">
                    2,450 recipients
                  </p>
                </div>

                <span className="font-semibold text-gray-900">
                  56.4%
                </span>
              </div>


              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium text-gray-900">
                    Product Launch
                  </p>

                  <p className="text-sm text-gray-500">
                    5,200 recipients
                  </p>
                </div>

                <span className="font-semibold text-gray-900">
                  51.2%
                </span>
              </div>


              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium text-gray-900">
                    August Newsletter
                  </p>

                  <p className="text-sm text-gray-500">
                    1,800 recipients
                  </p>
                </div>

                <span className="font-semibold text-gray-900">
                  47.8%
                </span>
              </div>

            </div>

          </div>


          {/* Sender Performance */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Sender Performance
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Performance of your sender accounts.
              </p>
            </div>


            <div className="divide-y divide-gray-100">

              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium text-gray-900">
                    marketing@company.com
                  </p>

                  <p className="text-sm text-gray-500">
                    18,420 emails sent
                  </p>
                </div>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  Excellent
                </span>
              </div>


              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium text-gray-900">
                    sales@company.com
                  </p>

                  <p className="text-sm text-gray-500">
                    15,830 emails sent
                  </p>
                </div>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  Good
                </span>
              </div>


              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium text-gray-900">
                    hello@company.com
                  </p>

                  <p className="text-sm text-gray-500">
                    13,920 emails sent
                  </p>
                </div>

                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                  Average
                </span>
              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  )
}

export default Analytics
